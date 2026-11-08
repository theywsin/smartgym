import { withTenant, type Tx } from "@smartgym/db";
import { gregorianToJalali, jalaliMonthLength, jalaliToGregorian } from "@smartgym/shared";
import { AppError, forbidden, notFound } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { writeAudit } from "../audit";
import { type TenantContext, requirePermission, requireWritableGym, primaryRole, canAccessBranch } from "../rbac/access";

type Method = "CASH" | "CARD_POS" | "TRANSFER" | "ONLINE";

export const DEFAULT_EXPENSE_CATEGORIES = ["اجاره", "حقوق و دستمزد", "قبوض", "تعمیرات و نگهداری", "تجهیزات", "نظافت و مصرفی", "تبلیغات", "سایر"];

const TEHRAN_OFFSET_MS = 3.5 * 3600_000;

async function ensureDefaults(tx: Tx, gymId: string) {
  const count = await tx.expenseCategory.count({ where: { gymId } });
  if (count === 0) {
    await tx.expenseCategory.createMany({ data: DEFAULT_EXPENSE_CATEGORIES.map((name) => ({ gymId, name })), skipDuplicates: true });
  }
}

export async function listExpenseCategories(deps: CoreDeps, ctx: TenantContext) {
  requirePermission(ctx, "finance.read");
  return withTenant(deps.db, ctx, async (tx) => {
    await ensureDefaults(tx, ctx.gymId);
    return tx.expenseCategory.findMany({ where: { gymId: ctx.gymId }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, isActive: true } });
  });
}

export async function createExpenseCategory(deps: CoreDeps, ctx: TenantContext, input: { name: string }) {
  requirePermission(ctx, "finance.manage");
  requireWritableGym(ctx);
  return withTenant(deps.db, ctx, async (tx) => {
    const exists = await tx.expenseCategory.findFirst({ where: { gymId: ctx.gymId, name: input.name } });
    if (exists) throw new AppError("CONFLICT", "این دسته از قبل وجود دارد.", { fields: { name: ["این دسته از قبل وجود دارد."] } });
    return tx.expenseCategory.create({ data: { gymId: ctx.gymId, name: input.name }, select: { id: true, name: true, isActive: true } });
  });
}

export async function setExpenseCategoryActive(deps: CoreDeps, ctx: TenantContext, id: string, isActive: boolean) {
  requirePermission(ctx, "finance.manage");
  requireWritableGym(ctx);
  return withTenant(deps.db, ctx, async (tx) => {
    const c = await tx.expenseCategory.findFirst({ where: { id, gymId: ctx.gymId } });
    if (!c) throw notFound("دسته");
    return tx.expenseCategory.update({ where: { id }, data: { isActive }, select: { id: true, name: true, isActive: true } });
  });
}

export interface ExpenseInput {
  categoryId: string;
  branchId?: string | null;
  amountRial: bigint;
  method: Method;
  description?: string | null;
  /** Defaults to now. */
  spentAt?: Date;
}

export async function createExpense(deps: CoreDeps, ctx: TenantContext, input: ExpenseInput) {
  requirePermission(ctx, "finance.manage");
  requireWritableGym(ctx);
  const now = nowOf(deps);
  const spentAt = input.spentAt ?? now;
  if (spentAt.getTime() > now.getTime() + 60_000) {
    throw new AppError("VALIDATION_FAILED", "تاریخ هزینه نمی‌تواند در آینده باشد.", { fields: { spentAt: ["تاریخ هزینه نمی‌تواند در آینده باشد."] } });
  }
  const branchId = input.branchId ?? (ctx.branchIds?.length === 1 ? ctx.branchIds[0]! : null);
  if (branchId && !canAccessBranch(ctx, branchId)) throw forbidden();
  if (!branchId && ctx.branchIds) throw forbidden();
  return withTenant(deps.db, ctx, async (tx) => {
    const cat = await tx.expenseCategory.findFirst({ where: { id: input.categoryId, gymId: ctx.gymId, isActive: true } });
    if (!cat) throw new AppError("VALIDATION_FAILED", "دسته‌ی هزینه را انتخاب کنید.", { fields: { categoryId: ["دسته‌ی هزینه را انتخاب کنید."] } });
    if (branchId && !(await tx.branch.findFirst({ where: { id: branchId, gymId: ctx.gymId, deletedAt: null } }))) throw notFound("شعبه");
    const e = await tx.expense.create({
      data: { gymId: ctx.gymId, branchId, categoryId: cat.id, amountRial: input.amountRial, method: input.method, description: input.description ?? null, spentAt, createdByUserId: ctx.userId },
    });
    await tx.ledgerEntry.create({
      data: { gymId: ctx.gymId, branchId, type: "EXPENSE", amountRial: -e.amountRial, method: e.method, expenseId: e.id, description: `${cat.name}${e.description ? `: ${e.description}` : ""}`, createdByUserId: ctx.userId, occurredAt: spentAt },
    });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "expense.create", entityType: "expense", entityId: e.id,
      after: { category: cat.name, amountRial: e.amountRial.toString(), method: e.method },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return e;
  });
}

/** Voids a wrong entry: the expense stays visible, the ledger gets an offsetting row dated today. */
export async function voidExpense(deps: CoreDeps, ctx: TenantContext, id: string, reason: string) {
  requirePermission(ctx, "finance.manage");
  requireWritableGym(ctx);
  const now = nowOf(deps);
  return withTenant(deps.db, ctx, async (tx) => {
    const found = await tx.expense.findFirst({ where: { id, gymId: ctx.gymId }, select: { id: true, branchId: true } });
    if (!found || (found.branchId && !canAccessBranch(ctx, found.branchId)) || (!found.branchId && ctx.branchIds)) throw notFound("هزینه");
    await tx.$queryRaw`SELECT id FROM "expense" WHERE id = ${id}::uuid FOR UPDATE`;
    const e = await tx.expense.findUniqueOrThrow({ where: { id } });
    if (e.voidedAt) throw new AppError("CONFLICT", "این هزینه قبلاً باطل شده است.");
    if (await tx.coachPayout.findUnique({ where: { expenseId: e.id } })) {
      throw new AppError("BUSINESS_RULE", "این هزینه تسویه‌ی کمیسیون مربی است و ابطال نمی‌شود. برای اصلاح، با مربی تسویه‌ی جبرانی ثبت کنید.");
    }
    const updated = await tx.expense.update({ where: { id }, data: { voidedAt: now, voidedByUserId: ctx.userId, voidReason: reason } });
    await tx.ledgerEntry.create({
      data: { gymId: ctx.gymId, branchId: e.branchId, type: "EXPENSE_VOID", amountRial: e.amountRial, method: e.method, expenseId: e.id, description: `ابطال هزینه: ${reason}`, createdByUserId: ctx.userId, occurredAt: now },
    });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "expense.void", entityType: "expense", entityId: e.id,
      after: { reason }, ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return updated;
  });
}

/** UTC range of a Jalali month in Tehran time. */
export function jalaliMonthRange(jy: number, jm: number) {
  const s = jalaliToGregorian(jy, jm, 1);
  const len = jalaliMonthLength(jy, jm);
  const e = jalaliToGregorian(jy, jm, len);
  const from = new Date(Date.UTC(s.y, s.m - 1, s.d) - TEHRAN_OFFSET_MS);
  const to = new Date(Date.UTC(e.y, e.m - 1, e.d) + 86_400_000 - TEHRAN_OFFSET_MS);
  return { from, to };
}

export function currentJalaliMonth(now: Date) {
  const t = new Date(now.getTime() + TEHRAN_OFFSET_MS);
  const j = gregorianToJalali(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
  return { year: j.y, month: j.m };
}

function scopeWhere(ctx: TenantContext, branchId?: string) {
  if (branchId && !canAccessBranch(ctx, branchId)) throw forbidden();
  return branchId ? { branchId } : ctx.branchIds ? { branchId: { in: [...ctx.branchIds] } } : {};
}

export async function listExpenses(deps: CoreDeps, ctx: TenantContext, opts: { year?: number; month?: number; branchId?: string }) {
  requirePermission(ctx, "finance.read");
  const cur = currentJalaliMonth(nowOf(deps));
  const { from, to } = jalaliMonthRange(opts.year ?? cur.year, opts.month ?? cur.month);
  return withTenant(deps.db, ctx, async (tx) =>
    tx.expense.findMany({
      where: { gymId: ctx.gymId, spentAt: { gte: from, lt: to }, ...scopeWhere(ctx, opts.branchId) },
      orderBy: { spentAt: "desc" },
      take: 500,
      include: { category: { select: { name: true } } },
    })
  );
}

/**
 * Monthly profit and loss from the ledger (cash basis): income, refunds, expenses by category, net.
 * Voided expenses and their offsetting rows cancel out.
 */
export async function profitReport(deps: CoreDeps, ctx: TenantContext, opts: { year?: number; month?: number; branchId?: string }) {
  requirePermission(ctx, "finance.read");
  const cur = currentJalaliMonth(nowOf(deps));
  const year = opts.year ?? cur.year;
  const month = opts.month ?? cur.month;
  const { from, to } = jalaliMonthRange(year, month);
  const scope = scopeWhere(ctx, opts.branchId);
  return withTenant(deps.db, ctx, async (tx) => {
    const sums = await tx.ledgerEntry.groupBy({
      by: ["type"],
      where: { gymId: ctx.gymId, occurredAt: { gte: from, lt: to }, ...scope },
      _sum: { amountRial: true },
    });
    const sum = (t: string) => sums.find((s) => s.type === t)?._sum.amountRial ?? 0n;
    // Expenses by category: active (non-voided) expenses spent in the month.
    const byCat = await tx.expense.groupBy({
      by: ["categoryId"],
      where: { gymId: ctx.gymId, spentAt: { gte: from, lt: to }, voidedAt: null, ...scope },
      _sum: { amountRial: true },
    });
    const cats = await tx.expenseCategory.findMany({ where: { id: { in: byCat.map((c) => c.categoryId) } }, select: { id: true, name: true } });
    const income = sum("INCOME");
    const refunds = -sum("REFUND");
    const expenses = -(sum("EXPENSE") + sum("EXPENSE_VOID"));
    return {
      year, month, from, to,
      incomeRial: income,
      refundRial: refunds,
      expenseRial: expenses,
      netRial: income - refunds - expenses,
      expensesByCategory: byCat
        .map((c) => ({ categoryId: c.categoryId, name: cats.find((x) => x.id === c.categoryId)?.name ?? "—", amountRial: c._sum.amountRial ?? 0n }))
        .sort((a, b) => (b.amountRial > a.amountRial ? 1 : -1)),
    };
  });
}
