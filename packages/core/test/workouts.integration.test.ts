/** Phase 5: coach portal (workout programs). Requires DATABASE_URL. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";
import { createPrismaClient, withTenant, type PrismaClient } from "@smartgym/db";
import { memberInputSchema, workoutProgramSchema } from "@smartgym/validation";
import {
  AppError, ConsoleSmsProvider, DEFAULT_CONFIG, type CoreDeps, type TenantContext,
  requestOtp, verifyOtp, registerGym, loadTenantContext, listBranches, inviteStaff,
  createMember,

  assignCoach, listMyAthletes, listPrograms, createProgram, updateProgram,
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

const program = (title: string) => workoutProgramSchema.parse({
  title, goal: "عضله‌سازی",
  days: [{ title: "روز ۱", exercises: [{ name: "پرس سینه", sets: 4, reps: "8-10", restSeconds: 90 }, { name: "زیربغل", sets: 3, reps: "12" }] }],
});

describe.skipIf(!hasDb)("workout programs", () => {
  let owner: TenantContext;
  let coachA: TenantContext;
  let coachB: TenantContext;
  let reception: TenantContext;
  let other: TenantContext;
  let mine: string;
  let notMine: string;

  beforeAll(async () => {
    db = createPrismaClient(process.env.DATABASE_URL);
    sms = new ConsoleSmsProvider();
    deps = { db, sms, config: { ...DEFAULT_CONFIG, otpPepper: "test-pepper-0123456789-0123456789", jwtSecret: "test-jwt-secret-0123456789-0123456789" } };
    const ownerId = (await signIn(phone())).user.id;
    const otherId = (await signIn(phone())).user.id;
    const gym = await registerGym(deps, ownerId, { name: "باشگاه مربی", firstBranchName: "مرکزی" });
    const gym2 = await registerGym(deps, otherId, { name: "دیگری", firstBranchName: "اصلی" });
    owner = await loadTenantContext(db, ownerId, gym.id);
    other = await loadTenantContext(db, otherId, gym2.id);
    const branch = (await listBranches(deps, owner))[0]!.id;
    reception = await loadTenantContext(db, (await inviteStaff(deps, owner, { phone: phone(), role: "RECEPTIONIST", branchIds: [branch] })).userId, gym.id);
    coachA = await loadTenantContext(db, (await inviteStaff(deps, owner, { phone: phone(), role: "COACH", branchIds: [] })).userId, gym.id);
    coachB = await loadTenantContext(db, (await inviteStaff(deps, owner, { phone: phone(), role: "COACH", branchIds: [] })).userId, gym.id);
    mine = (await createMember(deps, reception, memberInputSchema.parse({ firstName: "شاگرد", lastName: "یک" }))).id;
    notMine = (await createMember(deps, reception, memberInputSchema.parse({ firstName: "شاگرد", lastName: "دو" }))).id;
    await assignCoach(deps, owner, mine, coachA.userId);
    await assignCoach(deps, owner, notMine, coachB.userId);
  });
  afterAll(async () => db?.$disconnect());

  it("lists only the coach's own athletes", async () => {
    const a = await listMyAthletes(deps, coachA);
    expect(a.map((x) => x.memberId)).toEqual([mine]);
    expect(a[0]!.program).toBeNull();
    await expectCode(listMyAthletes(deps, reception), "FORBIDDEN");
  });

  it("creates, edits and versions programs; one active at a time", async () => {
    const p1 = await createProgram(deps, coachA, mine, program("برنامه‌ی اول"));
    const p2 = await createProgram(deps, coachA, mine, program("برنامه‌ی دوم"));
    const list = await listPrograms(deps, coachA, mine);
    expect(list.map((p) => [p.title, p.isActive])).toEqual([["برنامه‌ی دوم", true], ["برنامه‌ی اول", false]]);
    await updateProgram(deps, coachA, p2.id, program("برنامه‌ی دوم اصلاح‌شده"));
    await expectCode(updateProgram(deps, coachA, p1.id, program("x")), "FORBIDDEN");
    expect((await listMyAthletes(deps, coachA))[0]!.program!.title).toBe("برنامه‌ی دوم اصلاح‌شده");
    // Owner (coaches.manage) may manage any member's program.
    await createProgram(deps, owner, notMine, program("از طرف مدیر"));
  });

  it("hides other coaches' athletes and other gyms", async () => {
    await expectCode(listPrograms(deps, coachA, notMine), "NOT_FOUND");
    await expectCode(createProgram(deps, coachA, notMine, program("x")), "NOT_FOUND");
    const theirs = (await listPrograms(deps, owner, notMine))[0]!;
    await expectCode(updateProgram(deps, coachA, theirs.id, program("x")), "NOT_FOUND");
    await expectCode(listPrograms(deps, other, mine), "NOT_FOUND");
    await expectCode(createProgram(deps, reception, mine, program("x")), "FORBIDDEN");
  });

  it("after reassignment the old coach loses access", async () => {
    await assignCoach(deps, owner, mine, coachB.userId);
    await expectCode(listPrograms(deps, coachA, mine), "NOT_FOUND");
    expect((await listPrograms(deps, coachB, mine)).length).toBe(2);
  });
});
