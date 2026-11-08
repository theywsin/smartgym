import { withTenant } from "@smartgym/db";
import type { CheckInInput, ListAttendanceInput } from "@smartgym/validation";
import { toPersianDigits } from "@smartgym/shared";
import { AppError, notFound } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { writeAudit } from "../audit";
import { type TenantContext, requirePermission, requireWritableGym, primaryRole, canAccessBranch } from "../rbac/access";
import { findAccessibleMember, memberScope } from "../members";

const DAY = 86_400_000;
/** An entry with no check-out older than this no longer blocks a new check-in. */
const OPEN_VISIT_MS = 4 * 3600_000;
/** Iran has used a fixed UTC+03:30 offset since 2022 (no DST). */
const TEHRAN_OFFSET_MS = 3.5 * 3600_000;

export function tehranDayStart(now: Date): Date {
  const local = now.getTime() + TEHRAN_OFFSET_MS;
  return new Date(local - (local % DAY) - TEHRAN_OFFSET_MS);
}

/**
 * Manual check-in at a branch. In one transaction: lock the member, refuse a duplicate open visit,
 * pick the running period that ends first and is valid at this branch, then consume one entry with
 * a guarded UPDATE so the entry limit cannot be exceeded under concurrency.
 */
export async function checkIn(deps: CoreDeps, ctx: TenantContext, input: CheckInInput, method: "MANUAL" | "QR" = "MANUAL") {
  requirePermission(ctx, "attendance.manage");
  requireWritableGym(ctx);
  if (!canAccessBranch(ctx, input.branchId)) throw new AppError("FORBIDDEN", "به این شعبه دسترسی ندارید.");
  const now = nowOf(deps);

  return withTenant(deps.db, ctx, async (tx) => {
    const branch = await tx.branch.findFirst({ where: { id: input.branchId, gymId: ctx.gymId, deletedAt: null, isActive: true }, select: { id: true } });
    if (!branch) throw notFound("شعبه");
    const member = await findAccessibleMember(tx, ctx, input.memberId);
    if (member.status !== "ACTIVE") throw new AppError("BUSINESS_RULE", "این عضو بایگانی شده است.");
    await tx.$queryRaw`SELECT id FROM "member" WHERE id = ${member.id}::uuid FOR UPDATE`;

    const open = await tx.attendance.findFirst({
      where: { gymId: ctx.gymId, memberId: member.id, checkedOutAt: null, checkedInAt: { gt: new Date(now.getTime() - OPEN_VISIT_MS) } },
      select: { id: true },
    });
    if (open) throw new AppError("CONFLICT", "ورود این عضو قبلاً ثبت شده و هنوز خروج نزده است.");

    const subs = await tx.memberSubscription.findMany({
      where: { gymId: ctx.gymId, memberId: member.id, status: { in: ["ACTIVE", "SUSPENDED"] } },
      orderBy: { endsAt: "asc" },
      include: { plan: { select: { name: true } } },
    });
    const t = now.getTime();
    const running = subs.filter((s) => s.status === "ACTIVE" && s.startsAt.getTime() <= t && s.endsAt.getTime() > t);
    const atBranch = running.filter((s) => s.allowedBranchIds.length === 0 || s.allowedBranchIds.includes(input.branchId));
    const usable = atBranch.filter((s) => s.entryLimit === null || s.entriesUsed < s.entryLimit);

    let chosen: (typeof subs)[number] | undefined;
    for (const s of usable) {
      const consumed = await tx.$executeRaw`
        UPDATE "member_subscription" SET entries_used = entries_used + 1, updated_at = now()
        WHERE id = ${s.id}::uuid AND (entry_limit IS NULL OR entries_used < entry_limit)`;
      if (consumed === 1) {
        chosen = s;
        break;
      }
    }
    if (!chosen) {
      if (atBranch.length > 0) throw new AppError("BUSINESS_RULE", "جلسات این اشتراک تمام شده است.");
      if (running.length > 0) throw new AppError("BUSINESS_RULE", "اشتراک این عضو در این شعبه معتبر نیست.");
      if (subs.some((s) => s.status === "SUSPENDED" && s.endsAt.getTime() > t)) throw new AppError("BUSINESS_RULE", "اشتراک این عضو تعلیق شده است.");
      const upcoming = subs.find((s) => s.status === "ACTIVE" && s.startsAt.getTime() > t);
      if (upcoming) throw new AppError("BUSINESS_RULE", "اشتراک این عضو هنوز شروع نشده است.");
      throw new AppError("BUSINESS_RULE", "این عضو اشتراک فعال ندارد.");
    }

    const visit = await tx.attendance.create({
      data: {
        gymId: ctx.gymId,
        branchId: input.branchId,
        memberId: member.id,
        subscriptionId: chosen.id,
        checkedInAt: now,
        method,
        recordedByUserId: ctx.userId,
      },
    });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "attendance.check_in", entityType: "attendance", entityId: visit.id,
      after: { memberId: member.id, branchId: input.branchId, subscriptionId: chosen.id, method },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    const entriesLeft = chosen.entryLimit === null ? null : chosen.entryLimit - chosen.entriesUsed - 1;
    const daysLeft = Math.max(0, Math.ceil((chosen.endsAt.getTime() - t) / DAY));
    return {
      id: visit.id,
      checkedInAt: visit.checkedInAt,
      member: { id: member.id, code: member.code, firstName: member.firstName, lastName: member.lastName },
      planName: chosen.plan.name,
      endsAt: chosen.endsAt,
      daysLeft,
      entriesLeft,
      warning:
        daysLeft <= 3
          ? `اشتراک ${toPersianDigits(daysLeft)} روز دیگر تمام می‌شود.`
          : entriesLeft !== null && entriesLeft <= 2
            ? `${toPersianDigits(entriesLeft)} جلسه باقی مانده است.`
            : null,
    };
  });
}

export async function checkOut(deps: CoreDeps, ctx: TenantContext, attendanceId: string) {
  requirePermission(ctx, "attendance.manage");
  requireWritableGym(ctx);
  const now = nowOf(deps);
  return withTenant(deps.db, ctx, async (tx) => {
    const a = await tx.attendance.findFirst({ where: { id: attendanceId, gymId: ctx.gymId } });
    if (!a || !canAccessBranch(ctx, a.branchId)) throw notFound("ورود");
    if (a.checkedOutAt) return a;
    return tx.attendance.update({ where: { id: a.id }, data: { checkedOutAt: now } });
  });
}

export async function listAttendance(deps: CoreDeps, ctx: TenantContext, input: ListAttendanceInput) {
  requirePermission(ctx, "attendance.read");
  if (input.branchId && !canAccessBranch(ctx, input.branchId)) throw new AppError("FORBIDDEN", "به این شعبه دسترسی ندارید.");
  const now = nowOf(deps);
  const from = input.from ? new Date(input.from) : tehranDayStart(now);
  const to = input.to ? new Date(input.to) : new Date(from.getTime() + DAY);
  const where = {
    gymId: ctx.gymId,
    checkedInAt: { gte: from, lt: to },
    ...(input.memberId ? { memberId: input.memberId } : {}),
    ...(input.branchId ? { branchId: input.branchId } : ctx.branchIds ? { branchId: { in: [...ctx.branchIds] } } : {}),
    member: memberScope(ctx),
  };
  return withTenant(deps.db, ctx, async (tx) => {
    const [total, inside, rows] = await Promise.all([
      tx.attendance.count({ where }),
      tx.attendance.count({ where: { ...where, checkedOutAt: null, checkedInAt: { gte: new Date(Math.max(from.getTime(), now.getTime() - OPEN_VISIT_MS)), lt: to } } }),
      tx.attendance.findMany({
        where,
        orderBy: { checkedInAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: {
          member: { select: { id: true, code: true, firstName: true, lastName: true } },
          subscription: { select: { plan: { select: { name: true } } } },
        },
      }),
    ]);
    return {
      from,
      to,
      total,
      inside,
      page: input.page,
      pageSize: input.pageSize,
      items: rows.map((r) => ({
        id: r.id,
        branchId: r.branchId,
        checkedInAt: r.checkedInAt,
        checkedOutAt: r.checkedOutAt,
        method: r.method,
        member: r.member,
        planName: r.subscription.plan.name,
      })),
    };
  });
}
