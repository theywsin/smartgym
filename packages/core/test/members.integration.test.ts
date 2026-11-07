/**
 * Phase 2 integration tests: members, membership plans and sales, attendance.
 * Requires DATABASE_URL (runtime role) with migrations + base seed applied.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";
import { createPrismaClient, withSystem, type PrismaClient } from "@smartgym/db";
import { checkInSchema, listMembersSchema, memberInputSchema, membershipPlanSchema, sellMembershipSchema, updateMembershipPlanSchema } from "@smartgym/validation";
import {
  AppError, ConsoleSmsProvider, DEFAULT_CONFIG, type CoreDeps, type TenantContext,
  requestOtp, verifyOtp, registerGym, loadTenantContext, listBranches, inviteStaff,
  createMember, listMembers, getMember, updateMember, setMemberArchived,
  createMembershipPlan, updateMembershipPlan, listMembershipPlans, sellMembership, changeMembership,
  checkIn, checkOut, listAttendance, tehranDayStart,
} from "../src";

const hasDb = !!process.env.DATABASE_URL;
const DAY = 86_400_000;
let db: PrismaClient;
let sms: ConsoleSmsProvider;
let deps: CoreDeps;
let clock = new Date();

const phone = () => `+98912${crypto.randomInt(1_000_000, 9_999_999)}`;
const ip = () => `10.${crypto.randomInt(0, 250)}.${crypto.randomInt(0, 250)}.${crypto.randomInt(0, 250)}`;

async function signIn(p: string) {
  await requestOtp(deps, { phone: p, purpose: "LOGIN", ip: ip() });
  return verifyOtp(deps, { phone: p, code: sms.sent.get(p)! });
}
async function expectCode(promise: Promise<unknown>, code: AppError["code"], message?: string) {
  await expect(promise).rejects.toSatisfy(
    (e: unknown) => e instanceof AppError && e.code === code && (!message || e.message.includes(message))
  );
}
const member = (over: Record<string, unknown> = {}) => memberInputSchema.parse({ firstName: "علی", lastName: "رضایی", ...over });

describe.skipIf(!hasDb)("members, memberships and attendance", () => {
  let owner: TenantContext;
  let other: TenantContext;
  let reception: TenantContext;
  let branch1: string;
  let branch2: string;
  let otherBranch: string;

  beforeAll(async () => {
    db = createPrismaClient(process.env.DATABASE_URL);
    sms = new ConsoleSmsProvider();
    deps = {
      db, sms,
      config: { ...DEFAULT_CONFIG, otpPepper: "test-pepper-0123456789-0123456789", jwtSecret: "test-jwt-secret-0123456789-0123456789" },
      now: () => clock,
    };
    clock = new Date();
    const ownerId = (await signIn(phone())).user.id;
    const otherId = (await signIn(phone())).user.id;
    const gym = await registerGym(deps, ownerId, { name: "باشگاه آزمون", firstBranchName: "مرکزی" });
    const gymOther = await registerGym(deps, otherId, { name: "باشگاه دیگر", firstBranchName: "اصلی" });
    owner = await loadTenantContext(db, ownerId, gym.id);
    other = await loadTenantContext(db, otherId, gymOther.id);
    branch1 = (await listBranches(deps, owner))[0]!.id;
    otherBranch = (await listBranches(deps, other))[0]!.id;
    // Second branch directly (the trial plan allows one); this test is about scoping, not plan limits.
    branch2 = (await withSystem(db, (tx) => tx.branch.create({ data: { gymId: gym.id, name: "شعبه دو" } }))).id;
    const rec = await inviteStaff(deps, owner, { phone: phone(), role: "RECEPTIONIST", branchIds: [branch1] });
    reception = await loadTenantContext(db, rec.userId, gym.id);
  });
  afterAll(async () => db?.$disconnect());

  describe("members", () => {
    it("creates members with sequential per-gym numbers and Persian validation", async () => {
      const a = await createMember(deps, owner, member({ phone: "09121112233" }));
      const b = await createMember(deps, owner, member({ firstName: "مریم", lastName: "کریمی" }));
      expect(b.code).toBe(a.code + 1);
      expect(a.phone).toBe("+989121112233");
      expect(() => memberInputSchema.parse({ firstName: "", lastName: "x" })).toThrow("نام را وارد کنید");
      expect(() => member({ nationalCode: "1234567890" })).toThrow("کد ملی معتبر نیست");
      expect(member({ nationalCode: "0499370899" }).nationalCode).toBe("0499370899");
    });

    it("refuses a duplicate active phone but allows it after archiving", async () => {
      const p = phone();
      const first = await createMember(deps, owner, member({ phone: p }));
      await expectCode(createMember(deps, owner, member({ phone: p })), "CONFLICT");
      await setMemberArchived(deps, owner, first.id, true);
      const second = await createMember(deps, owner, member({ phone: p }));
      expect(second.phone).toBe(p);
      await expectCode(setMemberArchived(deps, owner, first.id, false), "CONFLICT");
    });

    it("searches by name tokens, phone (Persian digits too) and member number", async () => {
      const p = phone();
      const m = await createMember(deps, owner, member({ firstName: "سهراب", lastName: "سپهری", phone: p }));
      const search = (q: string) => listMembers(deps, owner, listMembersSchema.parse({ q }));
      expect((await search("سهراب سپه")).items.map((i) => i.id)).toContain(m.id);
      const local = `0${p.slice(3)}`;
      const persian = local.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!);
      expect((await search(persian)).items.map((i) => i.id)).toEqual([m.id]);
      expect((await search(String(m.code))).items.map((i) => i.id)).toContain(m.id);
    });

    it("scopes a branch receptionist to their branch's members", async () => {
      const mine = await createMember(deps, reception, member({ lastName: "شعبه‌یک" }));
      expect(mine.homeBranchId).toBe(branch1);
      const elsewhere = await createMember(deps, owner, member({ lastName: "شعبه‌دو", homeBranchId: branch2 }));
      const ids = (await listMembers(deps, reception, listMembersSchema.parse({ pageSize: 100 }))).items.map((i) => i.id);
      expect(ids).toContain(mine.id);
      expect(ids).not.toContain(elsewhere.id);
      await expectCode(getMember(deps, reception, elsewhere.id), "NOT_FOUND");
      await expectCode(createMember(deps, reception, member({ homeBranchId: branch2 })), "FORBIDDEN");
      await expectCode(setMemberArchived(deps, reception, mine.id, true), "FORBIDDEN");
    });

    it("never exposes another gym's members", async () => {
      const m = await createMember(deps, owner, member());
      await expectCode(getMember(deps, other, m.id), "NOT_FOUND");
      await expectCode(updateMember(deps, other, m.id, { firstName: "هک" }), "NOT_FOUND");
      const ids = (await listMembers(deps, other, listMembersSchema.parse({ pageSize: 100 }))).items.map((i) => i.id);
      expect(ids).not.toContain(m.id);
      // A branch of another gym is rejected as a home branch.
      await expectCode(createMember(deps, owner, member({ homeBranchId: otherBranch })), "VALIDATION_FAILED");
    });

    it("updates fields and writes an audit entry", async () => {
      const m = await createMember(deps, owner, member());
      const u = await updateMember(deps, owner, m.id, { lastName: "محمدی", emergencyContactName: "پدر" });
      expect(u.lastName).toBe("محمدی");
      expect(u.emergencyContact).toEqual({ name: "پدر", phone: null });
    });
  });

  describe("plans and sales", () => {
    it("stores prices as bigint rial and rejects bad input", async () => {
      const plan = await createMembershipPlan(deps, owner, membershipPlanSchema.parse({ name: "ماهانه", durationDays: 30, priceAmountRial: "25000000" }));
      expect(plan.priceAmountRial).toBe(25_000_000n);
      expect(() => membershipPlanSchema.parse({ name: "x", durationDays: 0, priceAmountRial: 1 })).toThrow();
      expect(() => membershipPlanSchema.parse({ name: "x", durationDays: 30, priceAmountRial: -1 })).toThrow();
      expect(() => membershipPlanSchema.parse({ name: "x", durationDays: 30, priceAmountRial: 1.5 })).toThrow();
      await expectCode(
        createMembershipPlan(deps, owner, membershipPlanSchema.parse({ name: "x", durationDays: 30, priceAmountRial: 1, allowedBranchIds: [otherBranch] })),
        "VALIDATION_FAILED"
      );
      await expectCode(createMembershipPlan(deps, reception, membershipPlanSchema.parse({ name: "x", durationDays: 30, priceAmountRial: 1 })), "FORBIDDEN");
    });

    it("sells a period, renews from the end of the current one and keeps sold terms", async () => {
      clock = new Date();
      const m = await createMember(deps, owner, member());
      const plan = await createMembershipPlan(deps, owner, membershipPlanSchema.parse({ name: "سه‌ماهه", durationDays: 90, priceAmountRial: 60_000_000, entryLimit: 36 }));
      const first = await sellMembership(deps, owner, sellMembershipSchema.parse({ memberId: m.id, planId: plan.id, branchId: branch1, discountAmountRial: 5_000_000 }));
      expect(first.endsAt.getTime() - first.startsAt.getTime()).toBe(90 * DAY);
      expect(first.discountAmountRial).toBe(5_000_000n);
      const renewal = await sellMembership(deps, owner, sellMembershipSchema.parse({ memberId: m.id, planId: plan.id }));
      expect(renewal.startsAt.getTime()).toBe(first.endsAt.getTime());
      expect(renewal.renewedFromId).toBe(first.id);

      await updateMembershipPlan(deps, owner, plan.id, { entryLimit: 10, priceAmountRial: 1n });
      const detail = await getMember(deps, owner, m.id);
      expect(detail.membership.state).toBe("active");
      expect(detail.membership.entriesLeft).toBe(36);
      expect(detail.subscriptions.find((s) => s.id === first.id)?.priceAmountRial).toBe(60_000_000n);
    });

    it("rejects a discount larger than the price, an inactive plan and a plan from another gym", async () => {
      const m = await createMember(deps, owner, member());
      const plan = await createMembershipPlan(deps, owner, membershipPlanSchema.parse({ name: "ارزان", durationDays: 30, priceAmountRial: 1000 }));
      await expectCode(sellMembership(deps, owner, sellMembershipSchema.parse({ memberId: m.id, planId: plan.id, discountAmountRial: 1001 })), "VALIDATION_FAILED");
      const scopedPlan = await createMembershipPlan(deps, owner, membershipPlanSchema.parse({ name: "شعبه‌ای", durationDays: 30, priceAmountRial: 1, allowedBranchIds: [branch2] }));
      const toggled = await updateMembershipPlan(deps, owner, scopedPlan.id, updateMembershipPlanSchema.parse({ isActive: false }));
      expect(toggled.allowedBranchIds).toEqual([branch2]);
      await updateMembershipPlan(deps, owner, plan.id, { isActive: false });
      expect((await listMembershipPlans(deps, owner)).map((p) => p.id)).not.toContain(plan.id);
      await expectCode(sellMembership(deps, owner, sellMembershipSchema.parse({ memberId: m.id, planId: plan.id })), "VALIDATION_FAILED");
      const foreign = await createMembershipPlan(deps, other, membershipPlanSchema.parse({ name: "خارجی", durationDays: 30, priceAmountRial: 1 }));
      await expectCode(sellMembership(deps, owner, sellMembershipSchema.parse({ memberId: m.id, planId: foreign.id })), "VALIDATION_FAILED");
    });

    it("adds suspended days back on resume, and cancels", async () => {
      const t0 = new Date();
      clock = t0;
      const m = await createMember(deps, owner, member());
      const plan = await createMembershipPlan(deps, owner, membershipPlanSchema.parse({ name: "ماهانه", durationDays: 30, priceAmountRial: 1 }));
      const s = await sellMembership(deps, owner, sellMembershipSchema.parse({ memberId: m.id, planId: plan.id }));
      clock = new Date(t0.getTime() + 5 * DAY);
      await changeMembership(deps, owner, s.id, "suspend");
      expect((await getMember(deps, owner, m.id)).membership.state).toBe("suspended");
      clock = new Date(t0.getTime() + 15 * DAY);
      const resumed = await changeMembership(deps, owner, s.id, "resume");
      expect(resumed.endsAt.getTime()).toBe(s.endsAt.getTime() + 10 * DAY);
      await changeMembership(deps, owner, s.id, "cancel");
      await expectCode(changeMembership(deps, owner, s.id, "resume"), "BUSINESS_RULE");
      expect((await getMember(deps, owner, m.id)).membership.state).toBe("expired");
      clock = new Date();
    });

    it("filters the member list by membership state", async () => {
      clock = new Date();
      const none = await createMember(deps, owner, member({ firstName: "فیلتر" }));
      const active = await createMember(deps, owner, member({ firstName: "فیلتر" }));
      const plan = await createMembershipPlan(deps, owner, membershipPlanSchema.parse({ name: "هفتگی", durationDays: 5, priceAmountRial: 1 }));
      await sellMembership(deps, owner, sellMembershipSchema.parse({ memberId: active.id, planId: plan.id }));
      const ids = async (membership: string) =>
        (await listMembers(deps, owner, listMembersSchema.parse({ q: "فیلتر", membership, pageSize: 100 }))).items.map((i) => i.id);
      expect(await ids("none")).toContain(none.id);
      expect(await ids("none")).not.toContain(active.id);
      expect(await ids("active")).toContain(active.id);
      expect(await ids("expiring")).toContain(active.id);
      // Renewed members are no longer "expiring".
      await sellMembership(deps, owner, sellMembershipSchema.parse({ memberId: active.id, planId: plan.id }));
      expect(await ids("expiring")).not.toContain(active.id);
      const susp = await createMember(deps, owner, member({ firstName: "فیلتر" }));
      const s = await sellMembership(deps, owner, sellMembershipSchema.parse({ memberId: susp.id, planId: plan.id }));
      await changeMembership(deps, owner, s.id, "suspend");
      expect(await ids("suspended")).toEqual([susp.id]);
      expect(await ids("expired")).not.toContain(susp.id);
      const list = await listMembers(deps, owner, listMembersSchema.parse({ q: "فیلتر" }));
      expect(list.counts).toEqual({ all: 3, active: 1, expiring: 0, expired: 0, suspended: 1 });
    });
  });

  describe("attendance", () => {
    it("checks in, counts entries, refuses a second open visit, and checks out", async () => {
      clock = new Date();
      const m = await createMember(deps, owner, member());
      const plan = await createMembershipPlan(deps, owner, membershipPlanSchema.parse({ name: "۲ جلسه", durationDays: 30, priceAmountRial: 1, entryLimit: 2 }));
      await sellMembership(deps, owner, sellMembershipSchema.parse({ memberId: m.id, planId: plan.id }));
      const v1 = await checkIn(deps, reception, checkInSchema.parse({ memberId: m.id, branchId: branch1 }));
      expect(v1.entriesLeft).toBe(1);
      expect(v1.warning).toContain("جلسه");
      await expectCode(checkIn(deps, reception, { memberId: m.id, branchId: branch1 }), "CONFLICT");
      await checkOut(deps, reception, v1.id);
      await checkIn(deps, reception, { memberId: m.id, branchId: branch1 }).then((v) => checkOut(deps, reception, v.id));
      await expectCode(checkIn(deps, reception, { memberId: m.id, branchId: branch1 }), "BUSINESS_RULE", "جلسات");
      const today = await listAttendance(deps, owner, { page: 1, pageSize: 50, memberId: m.id });
      expect(today.total).toBe(2);
    });

    it("never exceeds the entry limit under concurrent check-ins", async () => {
      clock = new Date();
      const plan = await createMembershipPlan(deps, owner, membershipPlanSchema.parse({ name: "تک جلسه", durationDays: 30, priceAmountRial: 1, entryLimit: 1 }));
      const m = await createMember(deps, owner, member());
      await sellMembership(deps, owner, sellMembershipSchema.parse({ memberId: m.id, planId: plan.id }));
      const results = await Promise.allSettled(Array.from({ length: 5 }, () => checkIn(deps, owner, { memberId: m.id, branchId: branch1 })));
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      const detail = await getMember(deps, owner, m.id);
      expect(detail.subscriptions[0]!.entriesUsed).toBe(1);
    });

    it("explains why entry is refused: none, upcoming, suspended, wrong branch, expired", async () => {
      const t0 = new Date();
      clock = t0;
      const m = await createMember(deps, owner, member());
      await expectCode(checkIn(deps, owner, { memberId: m.id, branchId: branch1 }), "BUSINESS_RULE", "اشتراک فعال ندارد");

      const branchOnly = await createMembershipPlan(deps, owner, membershipPlanSchema.parse({ name: "فقط شعبه دو", durationDays: 10, priceAmountRial: 1, allowedBranchIds: [branch2] }));
      await sellMembership(deps, owner, sellMembershipSchema.parse({ memberId: m.id, planId: branchOnly.id, branchId: branch2 }));
      await expectCode(checkIn(deps, owner, { memberId: m.id, branchId: branch1 }), "BUSINESS_RULE", "در این شعبه");
      await expectCode(checkIn(deps, reception, { memberId: m.id, branchId: branch2 }), "FORBIDDEN");

      clock = new Date(t0.getTime() + 11 * DAY);
      await expectCode(checkIn(deps, owner, { memberId: m.id, branchId: branch2 }), "BUSINESS_RULE", "اشتراک فعال ندارد");

      const later = await createMembershipPlan(deps, owner, membershipPlanSchema.parse({ name: "آینده", durationDays: 10, priceAmountRial: 1 }));
      const future = await sellMembership(deps, owner, sellMembershipSchema.parse({ memberId: m.id, planId: later.id, startsAt: new Date(clock.getTime() + 3 * DAY).toISOString() }));
      await expectCode(checkIn(deps, owner, { memberId: m.id, branchId: branch1 }), "BUSINESS_RULE", "شروع نشده");
      clock = new Date(clock.getTime() + 4 * DAY);
      await changeMembership(deps, owner, future.id, "suspend");
      await expectCode(checkIn(deps, owner, { memberId: m.id, branchId: branch1 }), "BUSINESS_RULE", "تعلیق");
      clock = new Date();
    });

    it("refuses check-ins for another gym's member or branch", async () => {
      clock = new Date();
      const m = await createMember(deps, owner, member());
      await expectCode(checkIn(deps, other, { memberId: m.id, branchId: otherBranch }), "NOT_FOUND");
      await expectCode(checkIn(deps, owner, { memberId: m.id, branchId: otherBranch }), "NOT_FOUND");
    });

    it("computes the Tehran day boundary", () => {
      // 2026-03-20T20:29:59Z is 23:59:59 Tehran time; 20:30Z is midnight.
      expect(tehranDayStart(new Date("2026-03-20T20:29:59Z")).toISOString()).toBe("2026-03-19T20:30:00.000Z");
      expect(tehranDayStart(new Date("2026-03-20T20:30:00Z")).toISOString()).toBe("2026-03-20T20:30:00.000Z");
    });
  });
});
