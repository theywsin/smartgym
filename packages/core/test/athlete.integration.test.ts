/** Phase 5: athlete self-service reads. Requires DATABASE_URL. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";
import { createPrismaClient, type PrismaClient } from "@smartgym/db";
import { checkInSchema, memberInputSchema, membershipPlanSchema, sellMembershipSchema, workoutProgramSchema } from "@smartgym/validation";
import {
  AppError, ConsoleSmsProvider, DEFAULT_CONFIG, type CoreDeps,
  requestOtp, verifyOtp, registerGym, loadTenantContext, inviteStaff, createMember,
  createMembershipPlan, sellMembership, assignCoach, createProgram, checkIn, listBranches,
  listMyMemberProfiles, getAthleteDashboard,
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

describe.skipIf(!hasDb)("athlete app", () => {
  const athletePhone = phone();
  let athlete: { id: string; phone: string };
  let memberA: string;
  let memberB: string;
  let stranger: string;

  beforeAll(async () => {
    db = createPrismaClient(process.env.DATABASE_URL);
    sms = new ConsoleSmsProvider();
    deps = { db, sms, config: { ...DEFAULT_CONFIG, otpPepper: "test-pepper-0123456789-0123456789", jwtSecret: "test-jwt-secret-0123456789-0123456789" } };
    const o1 = (await signIn(phone())).user.id;
    const o2 = (await signIn(phone())).user.id;
    const g1 = await registerGym(deps, o1, { name: "باشگاه الف", firstBranchName: "مرکزی" });
    const g2 = await registerGym(deps, o2, { name: "باشگاه ب", firstBranchName: "مرکزی" });
    const c1 = await loadTenantContext(db, o1, g1.id);
    const c2 = await loadTenantContext(db, o2, g2.id);
    memberA = (await createMember(deps, c1, memberInputSchema.parse({ firstName: "سارا", lastName: "رضایی", phone: athletePhone }))).id;
    memberB = (await createMember(deps, c2, memberInputSchema.parse({ firstName: "سارا", lastName: "ر", phone: athletePhone }))).id;
    stranger = (await createMember(deps, c1, memberInputSchema.parse({ firstName: "دیگر", lastName: "عضو", phone: phone() }))).id;
    const plan = await createMembershipPlan(deps, c1, membershipPlanSchema.parse({ name: "ماهانه", durationDays: 30, priceAmountRial: 10_000_000 }));
    await sellMembership(deps, c1, sellMembershipSchema.parse({ memberId: memberA, planId: plan.id }));
    const coach = await loadTenantContext(db, (await inviteStaff(deps, c1, { phone: phone(), role: "COACH", branchIds: [] })).userId, g1.id);
    await assignCoach(deps, c1, memberA, coach.userId);
    await createProgram(deps, coach, memberA, workoutProgramSchema.parse({ title: "برنامه‌ی سارا", days: [{ title: "روز ۱", exercises: [{ name: "اسکات", sets: 4, reps: "10" }] }] }));
    await checkIn(deps, c1, checkInSchema.parse({ memberId: memberA, branchId: (await listBranches(deps, c1))[0]!.id }));
    athlete = (await signIn(athletePhone)).user;
  });
  afterAll(async () => db?.$disconnect());

  it("lists member records matching the verified phone, across gyms", async () => {
    const profiles = await listMyMemberProfiles(deps, athlete);
    expect(profiles.map((p) => p.memberId).sort()).toEqual([memberA, memberB].sort());
    expect(profiles.find((p) => p.memberId === memberA)!.membership.state).toBe("active");
  });

  it("shows membership, program and coach on the dashboard", async () => {
    const d = await getAthleteDashboard(deps, athlete, memberA);
    expect(d.member.gymName).toBe("باشگاه الف");
    expect(d.membership.daysLeft).toBe(30);
    expect(d.subscriptions).toHaveLength(1);
    expect(d.visits).toHaveLength(1);
    expect(d.visitsLast30Days).toBe(1);
    expect(d.program?.title).toBe("برنامه‌ی سارا");
  });

  it("refuses another person's member id", async () => {
    await expect(getAthleteDashboard(deps, athlete, stranger)).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === "NOT_FOUND");
    const someoneElse = (await signIn(phone())).user;
    expect(await listMyMemberProfiles(deps, someoneElse)).toEqual([]);
  });
});
