/** Phase 6: platform super admin. Requires DATABASE_URL. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";
import { createPrismaClient, withSystem, type PrismaClient } from "@smartgym/db";
import { adminGymListSchema, memberInputSchema } from "@smartgym/validation";
import {
  AppError, ConsoleSmsProvider, DEFAULT_CONFIG, type CoreDeps,
  requestOtp, verifyOtp, registerGym, loadTenantContext, createMember,
  adminOverview, adminListGyms, adminSetGymStatus, adminSetGymPlan, adminListPlans,
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
const code = (c: AppError["code"]) => (e: unknown) => e instanceof AppError && e.code === c;

describe.skipIf(!hasDb)("super admin", () => {
  let admin: { userId: string };
  let owner: { userId: string };
  let gymId: string;
  const name = `باشگاه ادمین ${crypto.randomInt(1e6)}`;

  beforeAll(async () => {
    db = createPrismaClient(process.env.DATABASE_URL);
    sms = new ConsoleSmsProvider();
    deps = { db, sms, config: { ...DEFAULT_CONFIG, otpPepper: "test-pepper-0123456789-0123456789", jwtSecret: "test-jwt-secret-0123456789-0123456789" } };
    const a = (await signIn(phone())).user.id;
    await withSystem(db, (tx) => tx.user.update({ where: { id: a }, data: { isSuperAdmin: true } }));
    admin = { userId: a };
    owner = { userId: (await signIn(phone())).user.id };
    gymId = (await registerGym(deps, owner.userId, { name, firstBranchName: "مرکزی" })).id;
    await createMember(deps, await loadTenantContext(db, owner.userId, gymId), memberInputSchema.parse({ firstName: "a", lastName: "b" }));
  });
  afterAll(async () => db?.$disconnect());

  it("is refused to normal users, including gym owners", async () => {
    await expect(adminOverview(deps, owner)).rejects.toSatisfy(code("FORBIDDEN"));
    await expect(adminSetGymStatus(deps, owner, gymId, { status: "ACTIVE", reason: "self" })).rejects.toSatisfy(code("FORBIDDEN"));
  });

  it("lists gyms with owner, counts and trial subscription", async () => {
    const r = await adminListGyms(deps, admin, adminGymListSchema.parse({ q: name }));
    expect(r.total).toBe(1);
    expect(r.items[0]).toMatchObject({ id: gymId, status: "TRIAL", members: 1, branches: 1, subscription: { planKey: "starter", status: "TRIALING" } });
    expect((await adminOverview(deps, admin)).members).toBeGreaterThan(0);
  });

  it("changes the plan (modules follow) and activates the gym", async () => {
    expect((await loadTenantContext(db, owner.userId, gymId)).modules.has("store")).toBe(false);
    expect((await adminListPlans(deps, admin)).map((p) => p.key)).toContain("pro");
    await adminSetGymPlan(deps, admin, gymId, { planKey: "pro", months: 12 });
    const ctx = await loadTenantContext(db, owner.userId, gymId);
    expect(ctx.modules.has("store")).toBe(true);
    expect(ctx.gymStatus).toBe("ACTIVE");
  });

  it("suspends a gym (writes blocked) and records an audit row", async () => {
    await adminSetGymStatus(deps, admin, gymId, { status: "SUSPENDED", reason: "عدم پرداخت" });
    const ctx = await loadTenantContext(db, owner.userId, gymId);
    await expect(createMember(deps, ctx, memberInputSchema.parse({ firstName: "x", lastName: "y" }))).rejects.toSatisfy(code("GYM_SUSPENDED"));
    const audit = await withSystem(db, (tx) => tx.auditLog.findMany({ where: { gymId, action: { startsWith: "platform." } } }));
    expect(audit.map((a) => a.action).sort()).toEqual(["platform.gym_plan", "platform.gym_status"]);
  });
});
