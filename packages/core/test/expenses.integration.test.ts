/** Phase 3: expenses and monthly profit. Requires DATABASE_URL. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";
import { createPrismaClient, withTenant, type PrismaClient } from "@smartgym/db";
import { memberInputSchema, membershipPlanSchema, recordPaymentSchema, sellMembershipSchema, expenseSchema } from "@smartgym/validation";
import {
  AppError, ConsoleSmsProvider, DEFAULT_CONFIG, type CoreDeps, type TenantContext,
  requestOtp, verifyOtp, registerGym, loadTenantContext, listBranches, inviteStaff,
  createMember, getMember, createMembershipPlan, sellMembership,
  recordPayment, cashReport,
  listExpenseCategories, createExpenseCategory, createExpense, voidExpense, listExpenses, profitReport, jalaliMonthRange, currentJalaliMonth,
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


describe("jalali month range", () => {
  it("maps Aban 1405 to Tehran midnights", () => {
    const { from, to } = jalaliMonthRange(1405, 8);
    expect(from.toISOString()).toBe("2026-10-22T20:30:00.000Z");
    expect(to.toISOString()).toBe("2026-11-21T20:30:00.000Z");
    expect(currentJalaliMonth(new Date("2026-11-07T10:00:00Z"))).toEqual({ year: 1405, month: 8 });
  });
});

describe.skipIf(!hasDb)("expenses and profit", () => {
  let owner: TenantContext;
  let reception: TenantContext;
  let accountant: TenantContext;
  let other: TenantContext;

  beforeAll(async () => {
    db = createPrismaClient(process.env.DATABASE_URL);
    sms = new ConsoleSmsProvider();
    deps = { db, sms, config: { ...DEFAULT_CONFIG, otpPepper: "test-pepper-0123456789-0123456789", jwtSecret: "test-jwt-secret-0123456789-0123456789" } };
    const ownerId = (await signIn(phone())).user.id;
    const otherId = (await signIn(phone())).user.id;
    const gym = await registerGym(deps, ownerId, { name: "باشگاه هزینه", firstBranchName: "مرکزی" });
    const gym2 = await registerGym(deps, otherId, { name: "دیگری", firstBranchName: "اصلی" });
    owner = await loadTenantContext(db, ownerId, gym.id);
    other = await loadTenantContext(db, otherId, gym2.id);
    const branch = (await listBranches(deps, owner))[0]!.id;
    reception = await loadTenantContext(db, (await inviteStaff(deps, owner, { phone: phone(), role: "RECEPTIONIST", branchIds: [branch] })).userId, gym.id);
    accountant = await loadTenantContext(db, (await inviteStaff(deps, owner, { phone: phone(), role: "ACCOUNTANT", branchIds: [] })).userId, gym.id);
  });
  afterAll(async () => db?.$disconnect());

  it("seeds default categories once and enforces unique names", async () => {
    const a = await listExpenseCategories(deps, owner);
    expect(a.map((c) => c.name)).toContain("اجاره");
    expect((await listExpenseCategories(deps, owner)).length).toBe(a.length);
    await createExpenseCategory(deps, owner, { name: "بیمه" });
    await expectCode(createExpenseCategory(deps, owner, { name: "بیمه" }), "CONFLICT");
    await expectCode(createExpenseCategory(deps, reception, { name: "x" }), "FORBIDDEN");
  });

  it("records expenses, voids them append-only, and computes monthly profit", async () => {
    const cats = await listExpenseCategories(deps, owner);
    const rent = cats.find((c) => c.name === "اجاره")!.id;
    const bills = cats.find((c) => c.name === "قبوض")!.id;
    const planId = (await createMembershipPlan(deps, owner, membershipPlanSchema.parse({ name: "ماهانه", durationDays: 30, priceAmountRial: 30_000_000 }))).id;
    const m = await createMember(deps, reception, memberInputSchema.parse({ firstName: "سود", lastName: "زیان" }));
    await sellMembership(deps, reception, sellMembershipSchema.parse({ memberId: m.id, planId, payment: { amountRial: 30_000_000, method: "CASH" } }));

    await expectCode(createExpense(deps, reception, expenseSchema.parse({ categoryId: rent, amountRial: 1, method: "CASH" })), "FORBIDDEN");
    await createExpense(deps, accountant, expenseSchema.parse({ categoryId: rent, amountRial: 20_000_000, method: "TRANSFER", description: "آبان" }));
    const wrong = await createExpense(deps, owner, expenseSchema.parse({ categoryId: bills, amountRial: 9_000_000, method: "CASH" }));
    await createExpense(deps, owner, expenseSchema.parse({ categoryId: bills, amountRial: 3_000_000, method: "CASH" }));
    await expectCode(createExpense(deps, owner, expenseSchema.parse({ categoryId: rent, amountRial: 1, method: "CASH", spentAt: "2099-01-01" })), "VALIDATION_FAILED");

    await expectCode(voidExpense(deps, reception, wrong.id, "اشتباه"), "FORBIDDEN");
    await voidExpense(deps, owner, wrong.id, "مبلغ اشتباه");
    await expectCode(voidExpense(deps, owner, wrong.id, "دوباره"), "CONFLICT");

    const p = await profitReport(deps, accountant, {});
    expect(p).toMatchObject({ incomeRial: 30_000_000n, refundRial: 0n, expenseRial: 23_000_000n, netRial: 7_000_000n });
    expect(p.expensesByCategory.map((c) => [c.name, c.amountRial])).toEqual([["اجاره", 20_000_000n], ["قبوض", 3_000_000n]]);

    const list = await listExpenses(deps, owner, {});
    expect(list).toHaveLength(3);
    expect(list.find((e) => e.id === wrong.id)!.voidReason).toBe("مبلغ اشتباه");

    const till = await cashReport(deps, owner, {});
    expect(till.byMethod.find((x) => x.method === "CASH")!.expenseRial).toBe(3_000_000n); // 9m spent, 9m voided, 3m spent
    expect(till.byMethod.find((x) => x.method === "TRANSFER")!.expenseRial).toBe(20_000_000n);
  });

  it("cannot edit or delete expenses even with direct SQL as the app role", async () => {
    const e = (await listExpenses(deps, owner, {}))[0]!;
    await expect(withTenant(db, owner, (tx) => tx.$executeRaw`UPDATE "expense" SET amount_rial = 1 WHERE id = ${e.id}::uuid`)).rejects.toThrow();
    await expect(withTenant(db, owner, (tx) => tx.$executeRaw`DELETE FROM "expense" WHERE id = ${e.id}::uuid`)).rejects.toThrow();
  });

  it("isolates tenants", async () => {
    const e = (await listExpenses(deps, owner, {}))[0]!;
    expect(await listExpenses(deps, other, {})).toHaveLength(0);
    await expectCode(voidExpense(deps, other, e.id, "x"), "NOT_FOUND");
    expect((await profitReport(deps, other, {})).expenseRial).toBe(0n);
  });
});
