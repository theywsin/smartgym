/** Phase 3: shop and buffet. Requires DATABASE_URL. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";
import { createPrismaClient, withTenant, type PrismaClient } from "@smartgym/db";
import { productSchema, saleSchema } from "@smartgym/validation";
import {
  AppError, ConsoleSmsProvider, DEFAULT_CONFIG, type CoreDeps, type TenantContext,
  requestOtp, verifyOtp, registerGym, loadTenantContext, listBranches, inviteStaff,


  createProduct, updateProduct, listProducts, changeStock, createSale, voidSale, listSales, cashReport,
} from "../src";

const hasDb = !!process.env.DATABASE_URL;
let db: PrismaClient;
let sms: ConsoleSmsProvider;
let deps: CoreDeps;
const phone = () => `+98912${crypto.randomInt(1_000_000, 9_999_999)}`;
async function signIn(p: string) {
  await requestOtp(deps, { phone: p, purpose: "LOGIN", ip: `10.${crypto.randomInt(250)}.${crypto.randomInt(250)}.${crypto.randomInt(250)}` });
  return verifyOtp(deps, { phone: p, code: sms.sent.get(p)! });
}
async function expectCode(promise: Promise<unknown>, code: AppError["code"]) {
  await expect(promise).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === code);
}

describe.skipIf(!hasDb)("shop and buffet", () => {
  let owner: TenantContext;
  let reception: TenantContext;
  let coach: TenantContext;
  let other: TenantContext;
  let branch: string;
  let water: string;
  let tea: string;

  beforeAll(async () => {
    db = createPrismaClient(process.env.DATABASE_URL);
    sms = new ConsoleSmsProvider();
    deps = { db, sms, config: { ...DEFAULT_CONFIG, otpPepper: "test-pepper-0123456789-0123456789", jwtSecret: "test-jwt-secret-0123456789-0123456789" } };
    const ownerId = (await signIn(phone())).user.id;
    const otherId = (await signIn(phone())).user.id;
    const gym = await registerGym(deps, ownerId, { name: "باشگاه بوفه", firstBranchName: "مرکزی" });
    const gym2 = await registerGym(deps, otherId, { name: "دیگری", firstBranchName: "اصلی" });
    owner = await loadTenantContext(db, ownerId, gym.id);
    other = await loadTenantContext(db, otherId, gym2.id);
    branch = (await listBranches(deps, owner))[0]!.id;
    reception = await loadTenantContext(db, (await inviteStaff(deps, owner, { phone: phone(), role: "RECEPTIONIST", branchIds: [branch] })).userId, gym.id);
    coach = await loadTenantContext(db, (await inviteStaff(deps, owner, { phone: phone(), role: "COACH", branchIds: [] })).userId, gym.id);
    // New gyms trial the starter plan; shop and buffet are paid modules.
    const trialOwner = owner;
    await expectCode(createProduct(deps, trialOwner, productSchema.parse({ kind: "BUFFET", name: "x", priceRial: 1 })), "MODULE_NOT_IN_PLAN");
    const withStore = (c: TenantContext): TenantContext => ({ ...c, modules: new Set([...c.modules, "store", "buffet"]) });
    owner = withStore(owner);
    reception = withStore(reception);
    other = withStore(other);
  });
  afterAll(async () => db?.$disconnect());

  it("manages products and stock with permission checks", async () => {
    await expectCode(createProduct(deps, reception, productSchema.parse({ kind: "BUFFET", name: "آب", priceRial: 200_000 })), "FORBIDDEN");
    water = (await createProduct(deps, owner, productSchema.parse({ kind: "BUFFET", name: "آب معدنی", priceRial: 200_000 }))).id;
    tea = (await createProduct(deps, owner, productSchema.parse({ kind: "BUFFET", name: "چای", priceRial: 150_000, trackStock: false }))).id;
    await expectCode(createProduct(deps, owner, productSchema.parse({ kind: "BUFFET", name: "آب معدنی", priceRial: 1 })), "CONFLICT");
    expect(await changeStock(deps, owner, water, { branchId: branch, reason: "PURCHASE", quantity: 10 })).toEqual({ quantity: 10 });
    expect(await changeStock(deps, owner, water, { branchId: branch, reason: "ADJUST", quantity: 8 })).toEqual({ quantity: 8 });
    await expectCode(changeStock(deps, owner, tea, { branchId: branch, reason: "PURCHASE", quantity: 1 }), "BUSINESS_RULE");
    await expectCode(changeStock(deps, reception, water, { branchId: branch, reason: "PURCHASE", quantity: 1 }), "FORBIDDEN");
    const list = await listProducts(deps, reception);
    expect(list.find((p) => p.id === water)!.quantity).toBe(8);
    expect(list.find((p) => p.id === tea)!.quantity).toBeNull();
    await expectCode(listProducts(deps, coach), "FORBIDDEN");
  });

  it("sells at server prices, takes stock, records income, and is idempotent", async () => {
    const key = crypto.randomUUID();
    const sale = await createSale(deps, reception, saleSchema.parse({ method: "CASH", items: [{ productId: water, quantity: 2 }, { productId: tea, quantity: 3 }, { productId: water, quantity: 1 }] }), key);
    expect(sale.totalRial).toBe(3n * 200_000n + 3n * 150_000n);
    expect(sale.items).toHaveLength(2);
    expect((await createSale(deps, reception, saleSchema.parse({ method: "CASH", items: [{ productId: water, quantity: 1 }] }), key)).id).toBe(sale.id);
    expect((await listProducts(deps, owner)).find((p) => p.id === water)!.quantity).toBe(5);
    const till = await cashReport(deps, owner, {});
    expect(till.totalIncomeRial).toBe(1_050_000n);

    await expectCode(createSale(deps, reception, saleSchema.parse({ method: "CASH", items: [{ productId: water, quantity: 6 }] })), "BUSINESS_RULE");
    expect((await listProducts(deps, owner)).find((p) => p.id === water)!.quantity).toBe(5);
    await updateProduct(deps, owner, water, { priceRial: 250_000n });
    expect((await listSales(deps, reception, {})).sales[0]!.items.find((i) => i.productId === water)!.unitPriceRial).toBe(200_000n);
    await updateProduct(deps, owner, tea, { isActive: false });
    await expectCode(createSale(deps, reception, saleSchema.parse({ method: "CASH", items: [{ productId: tea, quantity: 1 }] })), "VALIDATION_FAILED");
    await updateProduct(deps, owner, tea, { isActive: true });
  });

  it("never oversells under concurrent sales", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => createSale(deps, reception, saleSchema.parse({ method: "CASH", items: [{ productId: water, quantity: 1 }] })))
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(5);
    expect((await listProducts(deps, owner)).find((p) => p.id === water)!.quantity).toBe(0);
  });

  it("voids a sale: stock and money come back, only for managers", async () => {
    const day = await listSales(deps, owner, {});
    const s = day.sales.find((x) => x.items.some((i) => i.productId === water && i.quantity === 1) && !x.voidedAt)!;
    await expectCode(voidSale(deps, reception, s.id, "اشتباه"), "FORBIDDEN");
    await voidSale(deps, owner, s.id, "اشتباه");
    await expectCode(voidSale(deps, owner, s.id, "دوباره"), "CONFLICT");
    expect((await listProducts(deps, owner)).find((p) => p.id === water)!.quantity).toBe(1);
    const after = await listSales(deps, owner, {});
    expect(after.totalRial).toBe(day.totalRial - s.totalRial);
    expect((await cashReport(deps, owner, {})).totalRefundRial).toBe(s.totalRial);
  });

  it("isolates tenants", async () => {
    expect(await listProducts(deps, other)).toHaveLength(0);
    await expectCode(createSale(deps, other, saleSchema.parse({ method: "CASH", items: [{ productId: water, quantity: 1 }] })), "VALIDATION_FAILED");
    await expectCode(changeStock(deps, other, water, { branchId: branch, reason: "PURCHASE", quantity: 1 }), "NOT_FOUND");
    await expect(withTenant(db, owner, (tx) => tx.$executeRaw`DELETE FROM "sale_item"`)).rejects.toThrow();
  });
});
