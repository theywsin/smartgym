/** Phase 3: coach commissions and payouts. Requires DATABASE_URL. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";
import { createPrismaClient, withTenant, type PrismaClient } from "@smartgym/db";
import { memberInputSchema, membershipPlanSchema, recordPaymentSchema, sellMembershipSchema, refundSchema } from "@smartgym/validation";
import {
  AppError, ConsoleSmsProvider, DEFAULT_CONFIG, type CoreDeps, type TenantContext,
  requestOtp, verifyOtp, registerGym, loadTenantContext, listBranches, inviteStaff,
  createMember, getMember, createMembershipPlan, sellMembership,
  recordPayment, cashReport,
  listExpenses, voidExpense, profitReport, updateCoach, assignCoach, refundPayment, commissionReport, payCoachCommission, currentJalaliMonth,
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

describe.skipIf(!hasDb)("coach commissions", () => {
  let owner: TenantContext;
  let reception: TenantContext;
  let other: TenantContext;
  let coachA: string;
  let coachB: string;
  let planId: string;
  const ym = currentJalaliMonth(new Date());

  beforeAll(async () => {
    db = createPrismaClient(process.env.DATABASE_URL);
    sms = new ConsoleSmsProvider();
    deps = { db, sms, config: { ...DEFAULT_CONFIG, otpPepper: "test-pepper-0123456789-0123456789", jwtSecret: "test-jwt-secret-0123456789-0123456789" } };
    const ownerId = (await signIn(phone())).user.id;
    const otherId = (await signIn(phone())).user.id;
    const gym = await registerGym(deps, ownerId, { name: "باشگاه کمیسیون", firstBranchName: "مرکزی" });
    const gym2 = await registerGym(deps, otherId, { name: "دیگری", firstBranchName: "اصلی" });
    owner = await loadTenantContext(db, ownerId, gym.id);
    other = await loadTenantContext(db, otherId, gym2.id);
    const branch = (await listBranches(deps, owner))[0]!.id;
    reception = await loadTenantContext(db, (await inviteStaff(deps, owner, { phone: phone(), role: "RECEPTIONIST", branchIds: [branch] })).userId, gym.id);
    coachA = (await inviteStaff(deps, owner, { phone: phone(), role: "COACH", branchIds: [], firstName: "آرش", lastName: "مربی" })).userId;
    coachB = (await inviteStaff(deps, owner, { phone: phone(), role: "COACH", branchIds: [] })).userId;
    await updateCoach(deps, owner, coachA, { commissionRateBp: 2000 }); // 20%
    planId = (await createMembershipPlan(deps, owner, membershipPlanSchema.parse({ name: "ماهانه", durationDays: 30, priceAmountRial: 10_000_000 }))).id;
  });
  afterAll(async () => db?.$disconnect());

  const memberWithCoach = async (coach: string | null) => {
    const m = await createMember(deps, reception, memberInputSchema.parse({ firstName: "شاگرد", lastName: "تست" }));
    if (coach) await assignCoach(deps, owner, m.id, coach);
    return m;
  };

  it("earns on payments made while the coach was assigned, net of refunds", async () => {
    const m1 = await memberWithCoach(coachA);
    await sellMembership(deps, reception, sellMembershipSchema.parse({ memberId: m1.id, planId, payment: { amountRial: 10_000_000, method: "CASH" } }));
    const m2 = await memberWithCoach(null);
    await sellMembership(deps, reception, sellMembershipSchema.parse({ memberId: m2.id, planId, payment: { amountRial: 10_000_000, method: "CASH" } }));
    await assignCoach(deps, owner, m2.id, coachA); // assigned after paying: not counted
    const m3 = await memberWithCoach(coachA);
    const s3 = await sellMembership(deps, reception, sellMembershipSchema.parse({ memberId: m3.id, planId, payment: { amountRial: 5_000_000, method: "CASH" } }));
    const p3 = (await withTenant(db, owner, (tx) => tx.payment.findFirstOrThrow({ where: { subscriptionId: s3.id } })));
    await refundPayment(deps, owner, p3.id, refundSchema.parse({ amountRial: 1_000_000, method: "CASH", reason: "انصراف" }));

    const r = await commissionReport(deps, owner, {});
    const a = r.coaches.find((c) => c.userId === coachA)!;
    expect(a).toMatchObject({ rateBp: 2000, payingMembers: 2, baseRial: 14_000_000n, earnedRial: 2_800_000n, paidRial: 0n, remainingRial: 2_800_000n, firstName: "آرش" });
    expect(r.coaches.find((c) => c.userId === coachB)).toMatchObject({ earnedRial: 0n, rateBp: 0 });
    await expectCode(commissionReport(deps, reception, {}), "FORBIDDEN");
  });

  it("pays out up to the remaining amount as a salary expense that cannot be voided", async () => {
    await expectCode(payCoachCommission(deps, reception, { coachUserId: coachA, year: ym.year, month: ym.month, amountRial: 1n, method: "CASH" }), "FORBIDDEN");
    await expectCode(payCoachCommission(deps, owner, { coachUserId: coachA, year: ym.year, month: ym.month, amountRial: 2_800_001n, method: "CASH" }), "VALIDATION_FAILED");
    const before = (await profitReport(deps, owner, {})).expenseRial;
    await Promise.allSettled([
      payCoachCommission(deps, owner, { coachUserId: coachA, year: ym.year, month: ym.month, amountRial: 2_000_000n, method: "TRANSFER" }),
      payCoachCommission(deps, owner, { coachUserId: coachA, year: ym.year, month: ym.month, amountRial: 2_000_000n, method: "TRANSFER" }),
    ]);
    const a = (await commissionReport(deps, owner, {})).coaches.find((c) => c.userId === coachA)!;
    expect(a).toMatchObject({ paidRial: 2_000_000n, remainingRial: 800_000n });
    expect((await profitReport(deps, owner, {})).expenseRial - before).toBe(2_000_000n);
    const exp = (await listExpenses(deps, owner, {})).find((e) => e.description?.startsWith("کمیسیون آرش"))!;
    expect(exp.category.name).toBe("حقوق و دستمزد");
    await expectCode(voidExpense(deps, owner, exp.id, "اشتباه"), "BUSINESS_RULE");
    await expectCode(payCoachCommission(deps, owner, { coachUserId: coachA, year: ym.year + 1, month: 1, amountRial: 1n, method: "CASH" }), "VALIDATION_FAILED");
  });

  it("isolates tenants", async () => {
    expect((await commissionReport(deps, other, {})).coaches.find((c) => c.userId === coachA)).toBeUndefined();
    await expectCode(payCoachCommission(deps, other, { coachUserId: coachA, year: ym.year, month: ym.month, amountRial: 1n, method: "CASH" }), "NOT_FOUND");
  });
});
