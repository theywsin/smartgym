import { withTenant } from "@smartgym/db";
import { formatToman } from "@smartgym/shared";
import { AppError, notFound } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { writeAudit } from "../audit";
import { type TenantContext, requirePermission, requireWritableGym, primaryRole } from "../rbac/access";
import { currentJalaliMonth, jalaliMonthRange, DEFAULT_EXPENSE_CATEGORIES } from "../expenses";

const SALARY_CATEGORY = DEFAULT_EXPENSE_CATEGORIES[1]!; // "حقوق و دستمزد"

/**
 * Commission for a Jalali month. Base = money actually received in the month (income minus refunds made
 * in the month) from members while this coach was their assigned coach at the time of the payment.
 * Rate = the coach's current commission rate (basis points).
 */
export async function commissionReport(deps: CoreDeps, ctx: TenantContext, opts: { year?: number; month?: number }) {
  requirePermission(ctx, "finance.read");
  const cur = currentJalaliMonth(nowOf(deps));
  const year = opts.year ?? cur.year;
  const month = opts.month ?? cur.month;
  const { from, to } = jalaliMonthRange(year, month);
  return withTenant(deps.db, ctx, async (tx) => {
    const base = await tx.$queryRaw<{ coach_user_id: string; base: bigint; members: bigint }[]>`
      SELECT ca.coach_user_id, SUM(l.amount_rial)::bigint AS base, COUNT(DISTINCT p.member_id)::bigint AS members
      FROM ledger_entry l
      JOIN payment p ON p.id = l.payment_id
      JOIN coach_athlete ca ON ca.member_id = p.member_id AND ca.gym_id = l.gym_id
        AND ca.started_at <= p.paid_at AND (ca.ended_at IS NULL OR ca.ended_at > p.paid_at)
      WHERE l.gym_id = ${ctx.gymId}::uuid AND l.type IN ('INCOME', 'REFUND')
        AND l.occurred_at >= ${from} AND l.occurred_at < ${to}
      GROUP BY ca.coach_user_id`;
    const coaches = await tx.gymMembership.findMany({
      where: { gymId: ctx.gymId, role: { key: "COACH" } },
      select: { userId: true, status: true, user: { select: { phone: true, profile: { select: { firstName: true, lastName: true } } } } },
    });
    const [profiles, payouts] = await Promise.all([
      tx.coachProfile.findMany({ where: { gymId: ctx.gymId }, select: { userId: true, commissionRateBp: true } }),
      tx.coachPayout.groupBy({ by: ["coachUserId"], where: { gymId: ctx.gymId, periodYear: year, periodMonth: month }, _sum: { amountRial: true } }),
    ]);
    const ids = new Set([...coaches.filter((c) => c.status === "ACTIVE").map((c) => c.userId), ...base.map((b) => b.coach_user_id), ...payouts.map((p) => p.coachUserId)]);
    const rows = [...ids].map((userId) => {
      const c = coaches.find((x) => x.userId === userId);
      const b = base.find((x) => x.coach_user_id === userId);
      const baseRial = b ? BigInt(b.base) : 0n;
      const rateBp = profiles.find((p) => p.userId === userId)?.commissionRateBp ?? 0;
      const earned = baseRial > 0n ? (baseRial * BigInt(rateBp)) / 10_000n : 0n;
      const paid = payouts.find((p) => p.coachUserId === userId)?._sum.amountRial ?? 0n;
      return {
        userId,
        firstName: c?.user.profile?.firstName ?? null,
        lastName: c?.user.profile?.lastName ?? null,
        phone: c?.user.phone ?? null,
        rateBp,
        payingMembers: b ? Number(b.members) : 0,
        baseRial,
        earnedRial: earned,
        paidRial: paid,
        remainingRial: earned - paid,
      };
    });
    rows.sort((a, b) => (b.earnedRial > a.earnedRial ? 1 : b.earnedRial < a.earnedRial ? -1 : 0));
    return { year, month, from, to, coaches: rows };
  });
}

/** Pays a coach (part of) a month's commission: an expense under salaries plus a payout row. */
export async function payCoachCommission(
  deps: CoreDeps,
  ctx: TenantContext,
  input: { coachUserId: string; year: number; month: number; amountRial: bigint; method: "CASH" | "CARD_POS" | "TRANSFER" }
) {
  requirePermission(ctx, "finance.manage");
  requireWritableGym(ctx);
  const now = nowOf(deps);
  const cur = currentJalaliMonth(now);
  if (input.year * 12 + input.month > cur.year * 12 + cur.month) throw new AppError("VALIDATION_FAILED", "ماه آینده قابل تسویه نیست.");
  const report = await commissionReport(deps, ctx, { year: input.year, month: input.month });
  const row = report.coaches.find((c) => c.userId === input.coachUserId);
  if (!row) throw notFound("مربی");
  return withTenant(deps.db, ctx, async (tx) => {
    // Serialise payouts per coach and month so two clicks can't both pass the remaining check.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`coach-payout:${ctx.gymId}:${input.coachUserId}:${input.year}-${input.month}`}))`;
    const paid = (await tx.coachPayout.aggregate({ where: { gymId: ctx.gymId, coachUserId: input.coachUserId, periodYear: input.year, periodMonth: input.month }, _sum: { amountRial: true } }))._sum.amountRial ?? 0n;
    const remaining = row.earnedRial - paid;
    if (input.amountRial > remaining) {
      const msg = remaining <= 0n ? "کمیسیون این ماه کامل تسویه شده است." : `حداکثر قابل پرداخت ${formatToman(remaining)} است.`;
      throw new AppError("VALIDATION_FAILED", msg, { fields: { amountRial: [msg] } });
    }
    let cat = await tx.expenseCategory.findFirst({ where: { gymId: ctx.gymId, name: SALARY_CATEGORY } });
    cat ??= await tx.expenseCategory.create({ data: { gymId: ctx.gymId, name: SALARY_CATEGORY } });
    const name = [row.firstName, row.lastName].filter(Boolean).join(" ") || row.phone || "مربی";
    const description = `کمیسیون ${name} برای ${input.year}/${String(input.month).padStart(2, "0")}`;
    const expense = await tx.expense.create({
      data: { gymId: ctx.gymId, categoryId: cat.id, amountRial: input.amountRial, method: input.method, description, spentAt: now, createdByUserId: ctx.userId },
    });
    await tx.ledgerEntry.create({
      data: { gymId: ctx.gymId, type: "EXPENSE", amountRial: -input.amountRial, method: input.method, expenseId: expense.id, description: `${cat.name}: ${description}`, createdByUserId: ctx.userId, occurredAt: now },
    });
    const payout = await tx.coachPayout.create({
      data: { gymId: ctx.gymId, coachUserId: input.coachUserId, periodYear: input.year, periodMonth: input.month, amountRial: input.amountRial, expenseId: expense.id, createdByUserId: ctx.userId },
    });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "coach.payout", entityType: "coach_payout", entityId: payout.id,
      after: { coachUserId: input.coachUserId, period: `${input.year}-${input.month}`, amountRial: input.amountRial.toString(), expenseId: expense.id },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return payout;
  });
}
