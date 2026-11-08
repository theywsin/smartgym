/** Phase 6: platform super admin. Requires DATABASE_URL. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";
import { createPrismaClient, withSystem, type PrismaClient } from "@smartgym/db";
import { adminGymListSchema, adminPlanSchema, adminUserListSchema, adminAuditListSchema, memberInputSchema } from "@smartgym/validation";
import {
  AppError, ConsoleSmsProvider, DEFAULT_CONFIG, type CoreDeps,
  requestOtp, verifyOtp, registerGym, loadTenantContext, createMember,
  adminOverview, adminListGyms, adminSetGymStatus, adminSetGymPlan, adminListPlans,
  adminListPlansFull, adminSavePlan, adminSetPlatformSetting, getPlatformSettings, adminListUsers, adminSetUserStatus, adminListAudit,
  DEFAULT_PLATFORM_SETTINGS, listPublicPlans,
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

  it("creates and edits SaaS plans; module changes reach gyms immediately", async () => {
    const key = `t${crypto.randomInt(1e6)}`;
    const input = adminPlanSchema.parse({ key, nameFa: "آزمایشی تست", monthlyAmountRial: 1000, annualAmountRial: 10000, trialDays: 7, limits: { members: 50, branches: 1 }, modules: ["core", "store"], isActive: true });
    await expect(adminSavePlan(deps, owner, null, input)).rejects.toSatisfy(code("FORBIDDEN"));
    await expect(adminSavePlan(deps, admin, null, { ...input, modules: ["store"] })).rejects.toSatisfy(code("VALIDATION_FAILED"));
    const { id } = await adminSavePlan(deps, admin, null, input);
    await expect(adminSavePlan(deps, admin, null, input)).rejects.toSatisfy(code("CONFLICT"));
    expect((await listPublicPlans(deps)).map((p) => p.key)).toContain(key);
    await adminSetGymStatus(deps, admin, gymId, { status: "ACTIVE", reason: "تست" });
    await adminSetGymPlan(deps, admin, gymId, { planKey: key, months: 1 });
    expect((await loadTenantContext(db, owner.userId, gymId)).modules.has("store")).toBe(true);
    await adminSavePlan(deps, admin, id, { ...input, modules: ["core"] });
    const ctx = await loadTenantContext(db, owner.userId, gymId);
    expect(ctx.modules.has("store")).toBe(false);
    expect(ctx.planLimits.members).toBe(50);
    const full = await adminListPlansFull(deps, admin);
    expect(full.plans.find((p) => p.key === key)).toMatchObject({ modules: ["core"], liveSubscriptions: 1 });
    // The trial plan cannot be deactivated.
    const starter = full.plans.find((p) => p.key === "starter")!;
    await expect(adminSavePlan(deps, admin, starter.id, adminPlanSchema.parse({ ...starter, monthlyAmountRial: starter.monthlyAmountRial.toString(), annualAmountRial: starter.annualAmountRial.toString(), limits: { members: 300, branches: 1 }, isActive: false }))).rejects.toSatisfy(code("BUSINESS_RULE"));
  });

  it("stores validated platform settings and can close gym signup", async () => {
    const before = await getPlatformSettings(deps);
    expect(before.site.name.length).toBeGreaterThan(1);
    await expect(adminSetPlatformSetting(deps, admin, "site", { ...before.site, supportEmail: "bad" })).rejects.toBeTruthy();
    await expect(adminSetPlatformSetting(deps, admin, "signup", { allowGymSignup: true, trialPlanKey: "nope" })).rejects.toSatisfy(code("VALIDATION_FAILED"));
    await adminSetPlatformSetting(deps, admin, "site", { ...before.site, supportPhone: "021-1234" });
    expect((await getPlatformSettings(deps)).site.supportPhone).toBe("021-1234");
    await adminSetPlatformSetting(deps, admin, "signup", { allowGymSignup: false, trialPlanKey: "starter" });
    try {
      await expect(registerGym(deps, (await signIn(phone())).user.id, { name: "بسته", firstBranchName: "x" })).rejects.toSatisfy(code("FORBIDDEN"));
    } finally {
      await adminSetPlatformSetting(deps, admin, "signup", DEFAULT_PLATFORM_SETTINGS.signup);
      await adminSetPlatformSetting(deps, admin, "site", before.site);
    }
  });

  it("disables a user (sessions revoked) and shows the audit trail", async () => {
    const victim = await signIn(phone());
    const found = await adminListUsers(deps, admin, adminUserListSchema.parse({ q: victim.user.phone.slice(-7) }));
    expect(found.items[0]!.id).toBe(victim.user.id);
    await expect(adminSetUserStatus(deps, admin, admin.userId, { status: "DISABLED", reason: "xxx" })).rejects.toSatisfy(code("BUSINESS_RULE"));
    await adminSetUserStatus(deps, admin, victim.user.id, { status: "DISABLED", reason: "سوءاستفاده" });
    const live = await withSystem(db, (tx) => tx.session.count({ where: { userId: victim.user.id, revokedAt: null } }));
    expect(live).toBe(0);
    const log = await adminListAudit(deps, admin, adminAuditListSchema.parse({ action: "platform.user" }));
    expect(log.items[0]!.entityId).toBe(victim.user.id);
  });
});
