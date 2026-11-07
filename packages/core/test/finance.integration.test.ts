/** Phase 3: payments, refunds, till report, debts. Requires DATABASE_URL. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";
import { createPrismaClient, withTenant, type PrismaClient } from "@smartgym/db";
import { memberInputSchema, membershipPlanSchema, recordPaymentSchema, refundSchema, sellMembershipSchema } from "@smartgym/validation";
import {
  AppError, ConsoleSmsProvider, DEFAULT_CONFIG, type CoreDeps, type TenantContext,
  requestOtp, verifyOtp, registerGym, loadTenantContext, listBranches, inviteStaff,
  createMember, getMember, createMembershipPlan, sellMembership,
  recordPayment, refundPayment, cashReport, listDebts, tehranDayRange,
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

describe.skipIf(!hasDb)("payments and till", () => {
  let owner: TenantContext;
  let reception: TenantContext;
  let other: TenantContext;
  let planId: string;

  beforeAll(async () => {
    db = createPrismaClient(process.env.DATABASE_URL);
    sms = new ConsoleSmsProvider();
    deps = { db, sms, config: { ...DEFAULT_CONFIG, otpPepper: "test-pepper-0123456789-0123456789", jwtSecret: "test-jwt-secret-0123456789-0123456789" } };
    const ownerId = (await signIn(phone())).user.id;
    const otherId = (await signIn(phone())).user.id;
    const gym = await registerGym(deps, ownerId, { name: "باشگاه مالی", firstBranchName: "مرکزی" });
    const gym2 = await registerGym(deps, otherId, { name: "دیگری", firstBranchName: "اصلی" });
    owner = await loadTenantContext(db, ownerId, gym.id);
    other = await loadTenantContext(db, otherId, gym2.id);
    const branch = (await listBranches(deps, owner))[0]!.id;
    reception = await loadTenantContext(db, (await inviteStaff(deps, owner, { phone: phone(), role: "RECEPTIONIST", branchIds: [branch] })).userId, gym.id);
    planId = (await createMembershipPlan(deps, owner, membershipPlanSchema.parse({ name: "ماهانه", durationDays: 30, priceAmountRial: 2_500_000_0 }))).id;
  });
  afterAll(async () => db?.$disconnect());

  const newSale = async (payment?: object, discount = 0) => {
    const m = await createMember(deps, reception, memberInputSchema.parse({ firstName: "پرداخت", lastName: "کننده" }));
    const s = await sellMembership(deps, reception, sellMembershipSchema.parse({ memberId: m.id, planId, discountAmountRial: discount, payment }));
    return { m, s };
  };

  it("takes payment with the sale, tracks debt, and accepts instalments up to the balance", async () => {
    const { m, s } = await newSale({ amountRial: 10_000_000, method: "CASH" }, 5_000_000);
    let d = await getMember(deps, owner, m.id);
    expect(d.subscriptions[0]).toMatchObject({ paidAmountRial: 10_000_000n, dueAmountRial: 10_000_000n });
    await expectCode(recordPayment(deps, reception, recordPaymentSchema.parse({ subscriptionId: s.id, amountRial: 10_000_001, method: "CARD_POS" })), "VALIDATION_FAILED");
    await recordPayment(deps, reception, recordPaymentSchema.parse({ subscriptionId: s.id, amountRial: 10_000_000, method: "CARD_POS", reference: "123456" }));
    d = await getMember(deps, owner, m.id);
    expect(d.subscriptions[0]!.dueAmountRial).toBe(0n);
    await expectCode(recordPayment(deps, reception, recordPaymentSchema.parse({ subscriptionId: s.id, amountRial: 1, method: "CASH" })), "VALIDATION_FAILED");
    expect((await listDebts(deps, owner)).map((x) => x.subscriptionId)).not.toContain(s.id);
  });

  it("rejects a sale whose payment exceeds the price and writes nothing", async () => {
    const m = await createMember(deps, reception, memberInputSchema.parse({ firstName: "زیاد", lastName: "پرداز" }));
    await expectCode(sellMembership(deps, reception, sellMembershipSchema.parse({ memberId: m.id, planId, payment: { amountRial: 25_000_001, method: "CASH" } })), "VALIDATION_FAILED");
    expect((await getMember(deps, owner, m.id)).subscriptions).toHaveLength(0);
  });

  it("is idempotent with the same key", async () => {
    const { s } = await newSale();
    const key = crypto.randomUUID();
    const a = await recordPayment(deps, reception, recordPaymentSchema.parse({ subscriptionId: s.id, amountRial: 1_000_000, method: "CASH" }), key);
    const b = await recordPayment(deps, reception, recordPaymentSchema.parse({ subscriptionId: s.id, amountRial: 1_000_000, method: "CASH" }), key);
    expect(b.id).toBe(a.id);
  });

  it("refunds up to the paid amount, only for finance roles, and reopens the debt", async () => {
    const { m, s } = await newSale({ amountRial: 25_000_000, method: "CARD_POS" });
    const pay = (await withTenant(db, owner, (tx) => tx.payment.findFirstOrThrow({ where: { subscriptionId: s.id } })));
    await expectCode(refundPayment(deps, reception, pay.id, refundSchema.parse({ amountRial: 1, method: "CASH", reason: "x" })), "FORBIDDEN");
    await refundPayment(deps, owner, pay.id, refundSchema.parse({ amountRial: 5_000_000, method: "CASH", reason: "انصراف" }));
    await expectCode(refundPayment(deps, owner, pay.id, refundSchema.parse({ amountRial: 20_000_001, method: "CASH", reason: "x" })), "VALIDATION_FAILED");
    expect((await getMember(deps, owner, m.id)).subscriptions[0]!.dueAmountRial).toBe(5_000_000n);
    expect((await listDebts(deps, owner)).find((x) => x.subscriptionId === s.id)?.dueRial).toBe(5_000_000n);
    await expectCode(refundPayment(deps, other, pay.id, refundSchema.parse({ amountRial: 1, method: "CASH", reason: "x" })), "NOT_FOUND");
  });

  it("keeps the ledger and payments immutable at the database level", async () => {
    await expect(withTenant(db, owner, (tx) => tx.ledgerEntry.deleteMany({ where: { gymId: owner.gymId } }))).rejects.toThrow();
    await expect(withTenant(db, owner, (tx) => tx.ledgerEntry.updateMany({ where: { gymId: owner.gymId }, data: { amountRial: 1n } }))).rejects.toThrow();
    await expect(withTenant(db, owner, (tx) => tx.payment.updateMany({ where: { gymId: owner.gymId }, data: { amountRial: 1n } }))).rejects.toThrow();
  });

  it("summarises the till per method for the day", async () => {
    const r = await cashReport(deps, reception, {});
    const cash = r.byMethod.find((x) => x.method === "CASH")!;
    const pos = r.byMethod.find((x) => x.method === "CARD_POS")!;
    expect(cash.incomeRial).toBe(10_000_000n + 1_000_000n);
    expect(cash.refundRial).toBe(5_000_000n);
    expect(pos.incomeRial).toBe(10_000_000n + 25_000_000n);
    expect(r.totalNetRial).toBe(r.totalIncomeRial - r.totalRefundRial);
    expect(r.entries.length).toBe(5);
    expect((await cashReport(deps, other, {})).entries).toHaveLength(0);
  });

  it("maps a Tehran calendar day to UTC", () => {
    const r = tehranDayRange("2026-03-21", new Date());
    expect(r.from.toISOString()).toBe("2026-03-20T20:30:00.000Z");
  });
});
