import { withTenant, type Tx } from "@smartgym/db";
import { formatToman } from "@smartgym/shared";
import type { PaymentInput, RecordPaymentInput, RefundInput } from "@smartgym/validation";
import { AppError, forbidden, notFound } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { writeAudit } from "../audit";
import { type TenantContext, requirePermission, requireWritableGym, primaryRole, canAccessBranch, hasPermission } from "../rbac/access";
import { findAccessibleMember, memberScope } from "../members";

const DAY = 86_400_000;
const TEHRAN_OFFSET_MS = 3.5 * 3600_000;

/** Amount still owed on a sold period: price - discount - (payments - refunds). */
export async function subscriptionBalance(tx: Tx, subscriptionId: string) {
  const sub = await tx.memberSubscription.findUniqueOrThrow({
    where: { id: subscriptionId },
    select: { priceAmountRial: true, discountAmountRial: true },
  });
  const agg = await tx.payment.aggregate({ where: { subscriptionId }, _sum: { amountRial: true, refundedAmountRial: true } });
  const paid = (agg._sum.amountRial ?? 0n) - (agg._sum.refundedAmountRial ?? 0n);
  const net = sub.priceAmountRial - sub.discountAmountRial;
  return { net, paid, due: net - paid };
}

/** Inside an open transaction with the subscription row locked by the caller. */
export async function takePaymentTx(
  tx: Tx,
  ctx: TenantContext,
  args: { subscriptionId: string; memberId: string; branchId: string | null; input: PaymentInput & { note?: string }; idempotencyKey?: string; now: Date }
) {
  const { due } = await subscriptionBalance(tx, args.subscriptionId);
  if (args.input.amountRial > due) {
    const msg = due <= 0n ? "این اشتراک بدهی ندارد." : `مبلغ از بدهی (${formatToman(due)}) بیشتر است.`;
    throw new AppError("VALIDATION_FAILED", msg, { fields: { amountRial: [msg] } });
  }
  const payment = await tx.payment.create({
    data: {
      gymId: ctx.gymId,
      branchId: args.branchId,
      memberId: args.memberId,
      subscriptionId: args.subscriptionId,
      amountRial: args.input.amountRial,
      method: args.input.method,
      reference: args.input.reference ?? null,
      note: args.input.note ?? null,
      receivedByUserId: ctx.userId,
      idempotencyKey: args.idempotencyKey ?? null,
      paidAt: args.now,
    },
  });
  await tx.ledgerEntry.create({
    data: {
      gymId: ctx.gymId,
      branchId: args.branchId,
      type: "INCOME",
      amountRial: payment.amountRial,
      method: payment.method,
      memberId: args.memberId,
      paymentId: payment.id,
      description: "پرداخت اشتراک",
      createdByUserId: ctx.userId,
      occurredAt: args.now,
    },
  });
  await writeAudit(tx, {
    gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
    action: "payment.create", entityType: "payment", entityId: payment.id,
    after: { subscriptionId: args.subscriptionId, amountRial: payment.amountRial.toString(), method: payment.method },
    ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
  });
  return payment;
}

/** Counter staff record a payment (or an instalment of a debt) against a sold period. */
export async function recordPayment(deps: CoreDeps, ctx: TenantContext, input: RecordPaymentInput, idempotencyKey?: string) {
  requirePermission(ctx, "memberships.manage");
  requireWritableGym(ctx);
  const now = nowOf(deps);
  return withTenant(deps.db, ctx, async (tx) => {
    if (idempotencyKey) {
      const existing = await tx.payment.findFirst({ where: { gymId: ctx.gymId, idempotencyKey } });
      if (existing) return existing;
    }
    const sub = await tx.memberSubscription.findFirst({ where: { id: input.subscriptionId, gymId: ctx.gymId } });
    if (!sub) throw notFound("اشتراک");
    await findAccessibleMember(tx, ctx, sub.memberId);
    const branchId = sub.branchId ?? (ctx.branchIds?.length === 1 ? ctx.branchIds[0]! : null);
    if (branchId && !canAccessBranch(ctx, branchId)) throw forbidden();
    await tx.$queryRaw`SELECT id FROM "member_subscription" WHERE id = ${sub.id}::uuid FOR UPDATE`;
    return takePaymentTx(tx, ctx, { subscriptionId: sub.id, memberId: sub.memberId, branchId, input, idempotencyKey, now });
  });
}

export async function refundPayment(deps: CoreDeps, ctx: TenantContext, paymentId: string, input: RefundInput) {
  requirePermission(ctx, "finance.manage");
  requireWritableGym(ctx);
  const now = nowOf(deps);
  return withTenant(deps.db, ctx, async (tx) => {
    const found = await tx.payment.findFirst({ where: { id: paymentId, gymId: ctx.gymId }, select: { id: true, branchId: true } });
    if (!found || (found.branchId && !canAccessBranch(ctx, found.branchId))) throw notFound("پرداخت");
    await tx.$queryRaw`SELECT id FROM "payment" WHERE id = ${paymentId}::uuid FOR UPDATE`;
    const p = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const refundable = p.amountRial - p.refundedAmountRial;
    if (input.amountRial > refundable) {
      const msg = refundable <= 0n ? "این پرداخت قبلاً کامل بازگردانده شده است." : `حداکثر قابل بازگشت ${formatToman(refundable)} است.`;
      throw new AppError("VALIDATION_FAILED", msg, { fields: { amountRial: [msg] } });
    }
    await tx.payment.update({ where: { id: p.id }, data: { refundedAmountRial: p.refundedAmountRial + input.amountRial } });
    const entry = await tx.ledgerEntry.create({
      data: {
        gymId: ctx.gymId,
        branchId: p.branchId,
        type: "REFUND",
        amountRial: -input.amountRial,
        method: input.method,
        memberId: p.memberId,
        paymentId: p.id,
        description: input.reason,
        createdByUserId: ctx.userId,
        occurredAt: now,
      },
    });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "payment.refund", entityType: "payment", entityId: p.id,
      after: { amountRial: input.amountRial.toString(), method: input.method, reason: input.reason },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return entry;
  });
}

export async function listMemberPayments(deps: CoreDeps, ctx: TenantContext, memberId: string) {
  requirePermission(ctx, "members.read");
  return withTenant(deps.db, ctx, async (tx) => {
    await findAccessibleMember(tx, ctx, memberId);
    return tx.payment.findMany({
      where: { gymId: ctx.gymId, memberId },
      orderBy: { paidAt: "desc" },
      take: 100,
      select: { id: true, subscriptionId: true, amountRial: true, refundedAmountRial: true, method: true, reference: true, paidAt: true },
    });
  });
}

export function tehranDayRange(date: string | undefined, now: Date) {
  const start = date
    ? new Date(new Date(`${date}T00:00:00Z`).getTime() - TEHRAN_OFFSET_MS)
    : (() => {
        const local = now.getTime() + TEHRAN_OFFSET_MS;
        return new Date(local - (local % DAY) - TEHRAN_OFFSET_MS);
      })();
  return { from: start, to: new Date(start.getTime() + DAY) };
}

/** Daily till report: money in and out per method, for one Tehran day and the user's branches. */
export async function cashReport(deps: CoreDeps, ctx: TenantContext, opts: { date?: string; branchId?: string }) {
  if (!hasPermission(ctx, "finance.read") && !hasPermission(ctx, "memberships.manage")) throw forbidden();
  if (opts.branchId && !canAccessBranch(ctx, opts.branchId)) throw forbidden();
  const { from, to } = tehranDayRange(opts.date, nowOf(deps));
  const where = {
    gymId: ctx.gymId,
    occurredAt: { gte: from, lt: to },
    ...(opts.branchId ? { branchId: opts.branchId } : ctx.branchIds ? { branchId: { in: [...ctx.branchIds] } } : {}),
  };
  return withTenant(deps.db, ctx, async (tx) => {
    const entries = await tx.ledgerEntry.findMany({ where, orderBy: { occurredAt: "desc" }, take: 1000 });
    const members = await tx.member.findMany({
      where: { id: { in: [...new Set(entries.flatMap((e) => (e.memberId ? [e.memberId] : [])))] } },
      select: { id: true, firstName: true, lastName: true, code: true },
    });
    const memberById = new Map(members.map((m) => [m.id, m]));
    const methods = ["CASH", "CARD_POS", "TRANSFER", "ONLINE"] as const;
    const byMethod = methods.map((method) => {
      const rows = entries.filter((e) => e.method === method);
      const total = (types: string[]) => rows.filter((e) => types.includes(e.type)).reduce((a, e) => a + e.amountRial, 0n);
      const income = total(["INCOME"]);
      const refund = -total(["REFUND"]);
      const expense = -total(["EXPENSE", "EXPENSE_VOID"]);
      return { method, incomeRial: income, refundRial: refund, expenseRial: expense, netRial: income - refund - expense };
    });
    return {
      from,
      to,
      byMethod,
      totalIncomeRial: byMethod.reduce((a, m) => a + m.incomeRial, 0n),
      totalRefundRial: byMethod.reduce((a, m) => a + m.refundRial, 0n),
      totalExpenseRial: byMethod.reduce((a, m) => a + m.expenseRial, 0n),
      totalNetRial: byMethod.reduce((a, m) => a + m.netRial, 0n),
      entries: entries.map((e) => ({
        id: e.id, type: e.type, amountRial: e.amountRial, method: e.method, description: e.description,
        branchId: e.branchId, occurredAt: e.occurredAt, member: e.memberId ? memberById.get(e.memberId) ?? null : null,
      })),
    };
  });
}

/** Members who owe money on sold periods (not cancelled), largest first. */
export async function listDebts(deps: CoreDeps, ctx: TenantContext) {
  requirePermission(ctx, "finance.read");
  return withTenant(deps.db, ctx, async (tx) => {
    const subs = await tx.memberSubscription.findMany({
      where: { gymId: ctx.gymId, status: { not: "CANCELLED" }, member: { status: "ACTIVE", ...memberScope(ctx) } },
      select: {
        id: true, priceAmountRial: true, discountAmountRial: true, endsAt: true,
        plan: { select: { name: true } },
        member: { select: { id: true, code: true, firstName: true, lastName: true, phone: true } },
        payments: { select: { amountRial: true, refundedAmountRial: true } },
      },
    });
    return subs
      .map((s) => {
        const paid = s.payments.reduce((a, p) => a + p.amountRial - p.refundedAmountRial, 0n);
        return { subscriptionId: s.id, planName: s.plan.name, endsAt: s.endsAt, member: s.member, dueRial: s.priceAmountRial - s.discountAmountRial - paid };
      })
      .filter((d) => d.dueRial > 0n)
      .sort((a, b) => (b.dueRial > a.dueRial ? 1 : b.dueRial < a.dueRial ? -1 : 0));
  });
}
