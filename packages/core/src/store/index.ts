import { withTenant, type Tx } from "@smartgym/db";
import { toPersianDigits } from "@smartgym/shared";
import type { ProductInput, SaleInput, StockChangeInput, UpdateProductInput } from "@smartgym/validation";
import { AppError, forbidden, notFound } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { writeAudit } from "../audit";
import { type TenantContext, requirePermission, requireWritableGym, primaryRole, canAccessBranch, hasPermission, requireModule } from "../rbac/access";
import { tehranDayRange } from "../finance";

type Kind = "STORE" | "BUFFET";

function requireManage(ctx: TenantContext, kind: Kind) {
  requireModule(ctx, kind === "STORE" ? "store" : "buffet");
  requirePermission(ctx, kind === "STORE" ? "store.manage" : "buffet.manage");
  requireWritableGym(ctx);
}

function canReadStore(ctx: TenantContext) {
  return ["store.read", "store.sell", "store.manage", "buffet.manage"].some((p) => hasPermission(ctx, p as never));
}

/** The branch a stock or sale action applies to: given, the user's only branch, or the gym's only branch. */
async function resolveBranch(tx: Tx, ctx: TenantContext, branchId?: string) {
  if (branchId) {
    if (!canAccessBranch(ctx, branchId)) throw forbidden();
    const b = await tx.branch.findFirst({ where: { id: branchId, gymId: ctx.gymId, deletedAt: null, isActive: true } });
    if (!b) throw notFound("شعبه");
    return b.id;
  }
  if (ctx.branchIds?.length === 1) return ctx.branchIds[0]!;
  const branches = await tx.branch.findMany({ where: { gymId: ctx.gymId, deletedAt: null, isActive: true }, select: { id: true }, take: 2 });
  if (branches.length === 1 && canAccessBranch(ctx, branches[0]!.id)) return branches[0]!.id;
  throw new AppError("VALIDATION_FAILED", "شعبه را انتخاب کنید.", { fields: { branchId: ["شعبه را انتخاب کنید."] } });
}

export async function listProducts(deps: CoreDeps, ctx: TenantContext, opts: { branchId?: string } = {}) {
  if (!canReadStore(ctx)) throw forbidden();
  return withTenant(deps.db, ctx, async (tx) => {
    const branchFilter = opts.branchId ? [opts.branchId] : ctx.branchIds ? [...ctx.branchIds] : null;
    if (opts.branchId && !canAccessBranch(ctx, opts.branchId)) throw forbidden();
    const products = await tx.product.findMany({
      where: { gymId: ctx.gymId },
      orderBy: [{ kind: "asc" }, { name: "asc" }],
      include: { stock: { where: branchFilter ? { branchId: { in: branchFilter } } : {}, select: { branchId: true, quantity: true } } },
    });
    return products.map(({ stock, ...p }) => ({
      ...p,
      stock,
      quantity: p.trackStock ? stock.reduce((a, s) => a + s.quantity, 0) : null,
    }));
  });
}

export async function createProduct(deps: CoreDeps, ctx: TenantContext, input: ProductInput) {
  requireManage(ctx, input.kind);
  return withTenant(deps.db, ctx, async (tx) => {
    if (await tx.product.findFirst({ where: { gymId: ctx.gymId, name: input.name } })) {
      throw new AppError("CONFLICT", "کالایی با این نام وجود دارد.", { fields: { name: ["کالایی با این نام وجود دارد."] } });
    }
    const p = await tx.product.create({ data: { gymId: ctx.gymId, kind: input.kind, name: input.name, sku: input.sku ?? null, priceRial: input.priceRial, trackStock: input.trackStock } });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "product.create", entityType: "product", entityId: p.id,
      after: { name: p.name, kind: p.kind, priceRial: p.priceRial.toString() },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return p;
  });
}

export async function updateProduct(deps: CoreDeps, ctx: TenantContext, productId: string, input: UpdateProductInput) {
  return withTenant(deps.db, ctx, async (tx) => {
    const p = await tx.product.findFirst({ where: { id: productId, gymId: ctx.gymId } });
    if (!p) throw notFound("کالا");
    requireManage(ctx, p.kind);
    if (input.name && input.name !== p.name && (await tx.product.findFirst({ where: { gymId: ctx.gymId, name: input.name } }))) {
      throw new AppError("CONFLICT", "کالایی با این نام وجود دارد.", { fields: { name: ["کالایی با این نام وجود دارد."] } });
    }
    const updated = await tx.product.update({
      where: { id: p.id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.sku !== undefined && { sku: input.sku }),
        ...(input.priceRial !== undefined && { priceRial: input.priceRial }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "product.update", entityType: "product", entityId: p.id,
      before: { name: p.name, priceRial: p.priceRial.toString(), isActive: p.isActive },
      after: { name: updated.name, priceRial: updated.priceRial.toString(), isActive: updated.isActive },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return updated;
  });
}

/** Goods in (PURCHASE adds) or a stock count (ADJUST sets the quantity). */
export async function changeStock(deps: CoreDeps, ctx: TenantContext, productId: string, input: StockChangeInput) {
  return withTenant(deps.db, ctx, async (tx) => {
    const p = await tx.product.findFirst({ where: { id: productId, gymId: ctx.gymId } });
    if (!p) throw notFound("کالا");
    requireManage(ctx, p.kind);
    if (!p.trackStock) throw new AppError("BUSINESS_RULE", "موجودی این کالا شمارش نمی‌شود.");
    const branchId = await resolveBranch(tx, ctx, input.branchId);
    await tx.$executeRaw`
      INSERT INTO "product_stock" (gym_id, product_id, branch_id, quantity, updated_at)
      VALUES (${ctx.gymId}::uuid, ${p.id}::uuid, ${branchId}::uuid, 0, now())
      ON CONFLICT (product_id, branch_id) DO NOTHING`;
    const [row] = await tx.$queryRaw<{ quantity: number }[]>`
      SELECT quantity FROM "product_stock" WHERE product_id = ${p.id}::uuid AND branch_id = ${branchId}::uuid FOR UPDATE`;
    const current = row!.quantity;
    const delta = input.reason === "PURCHASE" ? input.quantity : input.quantity - current;
    if (delta === 0) return { quantity: current };
    if (input.reason === "PURCHASE" && input.quantity === 0) throw new AppError("VALIDATION_FAILED", "تعداد را وارد کنید.", { fields: { quantity: ["تعداد را وارد کنید."] } });
    await tx.productStock.update({ where: { productId_branchId: { productId: p.id, branchId } }, data: { quantity: current + delta } });
    await tx.stockMovement.create({ data: { gymId: ctx.gymId, productId: p.id, branchId, delta, reason: input.reason, note: input.note ?? null, createdByUserId: ctx.userId } });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: `stock.${input.reason.toLowerCase()}`, entityType: "product", entityId: p.id,
      before: { quantity: current }, after: { quantity: current + delta, branchId },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return { quantity: current + delta };
  });
}

/** Counter sale: prices come from the server, stock is taken under a guarded update, money goes to the ledger. */
export async function createSale(deps: CoreDeps, ctx: TenantContext, input: SaleInput, idempotencyKey?: string) {
  requirePermission(ctx, "store.sell");
  requireWritableGym(ctx);
  const now = nowOf(deps);
  return withTenant(deps.db, ctx, async (tx) => {
    if (idempotencyKey) {
      const existing = await tx.sale.findFirst({ where: { gymId: ctx.gymId, idempotencyKey }, include: { items: true } });
      if (existing) return existing;
    }
    const branchId = await resolveBranch(tx, ctx, input.branchId);
    if (input.memberId && !(await tx.member.findFirst({ where: { id: input.memberId, gymId: ctx.gymId } }))) throw notFound("عضو");

    const qty = new Map<string, number>();
    for (const i of input.items) qty.set(i.productId, (qty.get(i.productId) ?? 0) + i.quantity);
    const ids = [...qty.keys()].sort();
    const products = await tx.product.findMany({ where: { id: { in: ids }, gymId: ctx.gymId, isActive: true } });
    if (products.length !== ids.length) throw new AppError("VALIDATION_FAILED", "یکی از کالاها پیدا نشد یا غیرفعال است.");
    for (const p of products) requireModule(ctx, p.kind === "STORE" ? "store" : "buffet");

    let total = 0n;
    const lines = ids.map((id) => {
      const p = products.find((x) => x.id === id)!;
      const n = qty.get(id)!;
      total += p.priceRial * BigInt(n);
      return { p, n };
    });
    if (total <= 0n) throw new AppError("VALIDATION_FAILED", "جمع فاکتور صفر است.");

    const sale = await tx.sale.create({
      data: { gymId: ctx.gymId, branchId, memberId: input.memberId ?? null, totalRial: total, method: input.method, idempotencyKey: idempotencyKey ?? null, createdByUserId: ctx.userId, createdAt: now },
    });
    for (const { p, n } of lines) {
      if (p.trackStock) {
        const updated = await tx.$executeRaw`
          UPDATE "product_stock" SET quantity = quantity - ${n}, updated_at = now()
          WHERE product_id = ${p.id}::uuid AND branch_id = ${branchId}::uuid AND quantity >= ${n}`;
        if (updated === 0) {
          const s = await tx.productStock.findUnique({ where: { productId_branchId: { productId: p.id, branchId } } });
          throw new AppError("BUSINESS_RULE", `موجودی «${p.name}» کافی نیست (موجود: ${toPersianDigits(s?.quantity ?? 0)}).`);
        }
        await tx.stockMovement.create({ data: { gymId: ctx.gymId, productId: p.id, branchId, delta: -n, reason: "SALE", saleId: sale.id, createdByUserId: ctx.userId } });
      }
      await tx.saleItem.create({
        data: { gymId: ctx.gymId, saleId: sale.id, productId: p.id, name: p.name, quantity: n, unitPriceRial: p.priceRial, lineTotalRial: p.priceRial * BigInt(n) },
      });
    }
    await tx.ledgerEntry.create({
      data: { gymId: ctx.gymId, branchId, type: "INCOME", amountRial: total, method: input.method, memberId: input.memberId ?? null, saleId: sale.id, description: "فروش فروشگاه/بوفه", createdByUserId: ctx.userId, occurredAt: now },
    });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "sale.create", entityType: "sale", entityId: sale.id,
      after: { totalRial: total.toString(), items: lines.map((l) => ({ productId: l.p.id, quantity: l.n })) },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return tx.sale.findUniqueOrThrow({ where: { id: sale.id }, include: { items: true } });
  });
}

/** Voids a sale: stock comes back, money goes out as a REFUND ledger row, the sale stays visible. */
export async function voidSale(deps: CoreDeps, ctx: TenantContext, saleId: string, reason: string) {
  if (!hasPermission(ctx, "store.manage") && !hasPermission(ctx, "finance.manage")) throw forbidden();
  requireWritableGym(ctx);
  const now = nowOf(deps);
  return withTenant(deps.db, ctx, async (tx) => {
    const found = await tx.sale.findFirst({ where: { id: saleId, gymId: ctx.gymId }, select: { id: true, branchId: true } });
    if (!found || !canAccessBranch(ctx, found.branchId)) throw notFound("فروش");
    await tx.$queryRaw`SELECT id FROM "sale" WHERE id = ${saleId}::uuid FOR UPDATE`;
    const sale = await tx.sale.findUniqueOrThrow({ where: { id: saleId }, include: { items: true } });
    if (sale.voidedAt) throw new AppError("CONFLICT", "این فروش قبلاً باطل شده است.");
    const moves = await tx.stockMovement.findMany({ where: { saleId: sale.id, reason: "SALE" } });
    for (const m of moves) {
      await tx.$executeRaw`UPDATE "product_stock" SET quantity = quantity + ${-m.delta}, updated_at = now() WHERE product_id = ${m.productId}::uuid AND branch_id = ${m.branchId}::uuid`;
      await tx.stockMovement.create({ data: { gymId: ctx.gymId, productId: m.productId, branchId: m.branchId, delta: -m.delta, reason: "SALE_VOID", saleId: sale.id, note: reason, createdByUserId: ctx.userId } });
    }
    await tx.sale.update({ where: { id: sale.id }, data: { voidedAt: now, voidedByUserId: ctx.userId, voidReason: reason } });
    await tx.ledgerEntry.create({
      data: { gymId: ctx.gymId, branchId: sale.branchId, type: "REFUND", amountRial: -sale.totalRial, method: sale.method, memberId: sale.memberId, saleId: sale.id, description: `ابطال فروش: ${reason}`, createdByUserId: ctx.userId, occurredAt: now },
    });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "sale.void", entityType: "sale", entityId: sale.id, after: { reason },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return { ...sale, voidedAt: now, voidReason: reason };
  });
}

/** One Tehran day of sales for the user's branches, with per-product totals. */
export async function listSales(deps: CoreDeps, ctx: TenantContext, opts: { date?: string; branchId?: string }) {
  if (!hasPermission(ctx, "store.sell") && !hasPermission(ctx, "store.manage") && !hasPermission(ctx, "finance.read")) throw forbidden();
  if (opts.branchId && !canAccessBranch(ctx, opts.branchId)) throw forbidden();
  const { from, to } = tehranDayRange(opts.date, nowOf(deps));
  return withTenant(deps.db, ctx, async (tx) => {
    const sales = await tx.sale.findMany({
      where: {
        gymId: ctx.gymId, createdAt: { gte: from, lt: to },
        ...(opts.branchId ? { branchId: opts.branchId } : ctx.branchIds ? { branchId: { in: [...ctx.branchIds] } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take: 500,
    });
    const live = sales.filter((s) => !s.voidedAt);
    const byProduct = new Map<string, { name: string; quantity: number; totalRial: bigint }>();
    for (const s of live) for (const i of s.items) {
      const r = byProduct.get(i.productId) ?? { name: i.name, quantity: 0, totalRial: 0n };
      r.quantity += i.quantity;
      r.totalRial += i.lineTotalRial;
      byProduct.set(i.productId, r);
    }
    return {
      from, to,
      totalRial: live.reduce((a, s) => a + s.totalRial, 0n),
      count: live.length,
      byProduct: [...byProduct.values()].sort((a, b) => (b.totalRial > a.totalRial ? 1 : -1)),
      sales,
    };
  });
}
