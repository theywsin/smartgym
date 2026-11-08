import { withSystem, withTenant } from "@smartgym/db";
import { toPersianDigits } from "@smartgym/shared";
import { type CoreDeps, nowOf } from "../deps";
import { writeAudit } from "../audit";
import { type TenantContext, requirePermission, requireWritableGym, primaryRole, hasPermission } from "../rbac/access";
import { forbidden } from "../errors";

const REMINDER_KEY = "notifications.expiry";
const DAY = 86_400_000;

export type ReminderSettings = { enabled: boolean; daysBefore: number };
const DEFAULT_REMINDER: ReminderSettings = { enabled: true, daysBefore: 3 };

function readReminder(v: unknown): ReminderSettings {
  const o = (v ?? {}) as Partial<ReminderSettings>;
  return {
    enabled: typeof o.enabled === "boolean" ? o.enabled : DEFAULT_REMINDER.enabled,
    daysBefore: Number.isInteger(o.daysBefore) && o.daysBefore! >= 1 && o.daysBefore! <= 14 ? o.daysBefore! : DEFAULT_REMINDER.daysBefore,
  };
}

export async function getReminderSettings(deps: CoreDeps, ctx: TenantContext) {
  if (!hasPermission(ctx, "settings.manage") && !hasPermission(ctx, "memberships.manage")) throw forbidden();
  return withTenant(deps.db, ctx, async (tx) => {
    const row = await tx.gymSetting.findUnique({ where: { gymId_key: { gymId: ctx.gymId, key: REMINDER_KEY } } });
    return { ...readReminder(row?.value), smsConfigured: deps.sms.supports("MEMBERSHIP_EXPIRY") };
  });
}

export async function setReminderSettings(deps: CoreDeps, ctx: TenantContext, input: ReminderSettings) {
  requirePermission(ctx, "settings.manage");
  requireWritableGym(ctx);
  return withTenant(deps.db, ctx, async (tx) => {
    const value = readReminder(input);
    await tx.gymSetting.upsert({
      where: { gymId_key: { gymId: ctx.gymId, key: REMINDER_KEY } },
      create: { gymId: ctx.gymId, key: REMINDER_KEY, value },
      update: { value },
    });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "settings.reminders.update", entityType: "gym_setting", after: value,
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return { ...value, smsConfigured: deps.sms.supports("MEMBERSHIP_EXPIRY") };
  });
}

type Due = { subscription_id: string; gym_id: string; member_id: string; ends_at: Date; first_name: string; phone: string; gym_name: string };

/**
 * Sends one "your membership ends in N days" SMS per sold period, N from each gym's setting (default 3).
 * Skips renewed members, archived members, members without a phone, and suspended or closed gyms.
 * Each send is claimed first in notification_log (unique per subscription), so overlapping runs
 * or a crash mid-run can never send the same reminder twice.
 */
export async function runExpiryReminders(deps: CoreDeps, opts: { limit?: number } = {}) {
  const now = nowOf(deps);
  const result = { sent: 0, failed: 0, skippedNoTemplate: false };
  if (!deps.sms.supports("MEMBERSHIP_EXPIRY")) return { ...result, skippedNoTemplate: true };
  const due = await withSystem(deps.db, (tx) => tx.$queryRaw<Due[]>`
    SELECT s.id AS subscription_id, s.gym_id, s.member_id, s.ends_at, m.first_name, m.phone, g.name AS gym_name
    FROM member_subscription s
    JOIN member m ON m.id = s.member_id
    JOIN gym g ON g.id = s.gym_id
    LEFT JOIN gym_setting gs ON gs.gym_id = s.gym_id AND gs.key = ${REMINDER_KEY}
    WHERE s.status = 'ACTIVE'
      AND s.ends_at > ${now}
      AND s.ends_at <= ${now}::timestamptz + make_interval(days => LEAST(14, GREATEST(1, COALESCE((gs.value->>'daysBefore')::int, ${DEFAULT_REMINDER.daysBefore}))))
      AND COALESCE((gs.value->>'enabled')::boolean, ${DEFAULT_REMINDER.enabled})
      AND m.status = 'ACTIVE' AND m.phone IS NOT NULL
      AND g.status IN ('TRIAL', 'ACTIVE') AND g.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM member_subscription s2
        WHERE s2.member_id = s.member_id AND s2.id <> s.id AND s2.status <> 'CANCELLED' AND s2.ends_at > s.ends_at)
      AND NOT EXISTS (SELECT 1 FROM notification_log n WHERE n.kind = 'membership_expiry' AND n.dedupe_key = s.id::text)
    ORDER BY s.ends_at
    LIMIT ${opts.limit ?? 500}`);

  for (const d of due) {
    const claimed = await withSystem(deps.db, (tx) => tx.$queryRaw<{ id: string }[]>`
      INSERT INTO notification_log (id, gym_id, member_id, kind, dedupe_key, channel, status, created_at)
      VALUES (gen_random_uuid(), ${d.gym_id}::uuid, ${d.member_id}::uuid, 'membership_expiry', ${d.subscription_id}, 'sms', 'PENDING', now())
      ON CONFLICT (kind, dedupe_key) DO NOTHING
      RETURNING id`);
    const id = claimed[0]?.id;
    if (!id) continue;
    const daysLeft = Math.max(1, Math.ceil((d.ends_at.getTime() - now.getTime()) / DAY));
    try {
      const r = await deps.sms.sendTemplate(d.phone, "MEMBERSHIP_EXPIRY", [d.first_name, d.gym_name, toPersianDigits(daysLeft)]);
      await withSystem(deps.db, (tx) => tx.notificationLog.update({ where: { id }, data: { status: "SENT", providerRef: r.providerRef ?? null, sentAt: nowOf(deps) } }));
      result.sent++;
    } catch (err) {
      // Not retried automatically: a failed SMS is shown to staff rather than risking a duplicate.
      await withSystem(deps.db, (tx) => tx.notificationLog.update({ where: { id }, data: { status: "FAILED", error: String(err).slice(0, 300) } }));
      result.failed++;
    }
  }
  return result;
}

/** Marks unpaid pay-by-link requests past their deadline as EXPIRED. */
export async function expireOnlinePaymentRequests(deps: CoreDeps) {
  const now = nowOf(deps);
  const r = await withSystem(deps.db, (tx) =>
    tx.onlinePaymentRequest.updateMany({ where: { status: "PENDING", expiresAt: { lte: now } }, data: { status: "EXPIRED" } })
  );
  return { expired: r.count };
}

export async function listMemberNotifications(deps: CoreDeps, ctx: TenantContext, memberId: string) {
  requirePermission(ctx, "members.read");
  return withTenant(deps.db, ctx, (tx) =>
    tx.notificationLog.findMany({ where: { gymId: ctx.gymId, memberId }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, kind: true, status: true, createdAt: true, sentAt: true } })
  );
}
