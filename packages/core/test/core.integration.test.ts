/**
 * Integration tests for auth, tenancy and RBAC against a real PostgreSQL database.
 * Requires DATABASE_URL (runtime role) with migrations + base seed applied.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";
import { createPrismaClient, type PrismaClient } from "@smartgym/db";
import {
  AppError,
  ConsoleSmsProvider,
  DEFAULT_CONFIG,
  type CoreDeps,
  requestOtp,
  verifyOtp,
  createSession,
  authenticateWebSession,
  issueAccessToken,
  authenticateAccessToken,
  rotateRefreshToken,
  revokeSession,
  setActiveGym,
  registerGym,
  listMyGyms,
  loadTenantContext,
  listBranches,
  createBranch,
  inviteStaff,
  listStaff,
  setPassword,
  loginWithPassword,
} from "../src";

const hasDb = !!process.env.DATABASE_URL;
let db: PrismaClient;
let sms: ConsoleSmsProvider;
let deps: CoreDeps;
let clock = new Date();

/** Random Iranian mobile so test runs don't collide. */
function phone(): string {
  return `+98912${crypto.randomInt(1_000_000, 9_999_999)}`;
}

async function signIn(p: string) {
  await requestOtp(deps, { phone: p, purpose: "LOGIN", ip: `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` });
  const code = sms.sent.get(p)!;
  return verifyOtp(deps, { phone: p, code });
}

async function expectCode(promise: Promise<unknown>, code: AppError["code"]) {
  await expect(promise).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === code);
}

describe.skipIf(!hasDb)("core services", () => {
  beforeAll(() => {
    db = createPrismaClient(process.env.DATABASE_URL);
    sms = new ConsoleSmsProvider();
    deps = {
      db,
      sms,
      config: { ...DEFAULT_CONFIG, otpPepper: "test-pepper-0123456789-0123456789", jwtSecret: "test-jwt-secret-0123456789-0123456789" },
      now: () => clock,
    };
  });
  afterAll(async () => db?.$disconnect());

  describe("OTP", () => {
    it("registers a new user on first verification", async () => {
      clock = new Date();
      const p = phone();
      const { user, isNewUser } = await signIn(p);
      expect(isNewUser).toBe(true);
      expect(user.phone).toBe(p);
      expect(user.phoneVerifiedAt).not.toBeNull();
    });

    it("stores only a hash of the code", async () => {
      const p = phone();
      await requestOtp(deps, { phone: p, purpose: "LOGIN" });
      const row = await db.otpChallenge.findFirstOrThrow({ where: { phone: p } });
      expect(row.codeHash).not.toContain(sms.sent.get(p)!);
    });

    it("rejects wrong codes, reuse, and enforces the resend cooldown", async () => {
      const p = phone();
      await requestOtp(deps, { phone: p, purpose: "LOGIN" });
      await expectCode(requestOtp(deps, { phone: p, purpose: "LOGIN" }), "RATE_LIMITED");
      await expectCode(verifyOtp(deps, { phone: p, code: "000000" === sms.sent.get(p) ? "111111" : "000000" }), "BAD_REQUEST");
      const code = sms.sent.get(p)!;
      await verifyOtp(deps, { phone: p, code });
      await expectCode(verifyOtp(deps, { phone: p, code }), "BAD_REQUEST");
    });

    it("locks a code after 5 wrong attempts", async () => {
      const p = phone();
      await requestOtp(deps, { phone: p, purpose: "LOGIN" });
      const right = sms.sent.get(p)!;
      const wrong = right === "123456" ? "654321" : "123456";
      for (let i = 0; i < 5; i++) await expectCode(verifyOtp(deps, { phone: p, code: wrong }), "BAD_REQUEST");
      await expectCode(verifyOtp(deps, { phone: p, code: right }), "RATE_LIMITED");
    });

    it("expires codes", async () => {
      const p = phone();
      const start = new Date();
      clock = start;
      await requestOtp(deps, { phone: p, purpose: "LOGIN" });
      clock = new Date(start.getTime() + 121_000);
      await expectCode(verifyOtp(deps, { phone: p, code: sms.sent.get(p)! }), "BAD_REQUEST");
      clock = new Date();
    });
  });

  describe("sessions", () => {
    it("authenticates and revokes web sessions", async () => {
      const { user } = await signIn(phone());
      const { session, token } = await createSession(deps, { userId: user.id, kind: "WEB" });
      expect((await authenticateWebSession(deps, token)).user.id).toBe(user.id);
      const stored = await db.session.findUniqueOrThrow({ where: { id: session.id } });
      expect(stored.tokenHash).not.toBe(token);
      await revokeSession(deps, user.id, session.id);
      await expectCode(authenticateWebSession(deps, token), "SESSION_EXPIRED");
    });

    it("expires idle web sessions", async () => {
      const { user } = await signIn(phone());
      const { token } = await createSession(deps, { userId: user.id, kind: "WEB" });
      const real = clock;
      clock = new Date(real.getTime() + 8 * 24 * 3600 * 1000);
      await expectCode(authenticateWebSession(deps, token), "SESSION_EXPIRED");
      clock = real;
    });

    it("rotates mobile refresh tokens and revokes the family on reuse", async () => {
      const { user } = await signIn(phone());
      const first = await createSession(deps, { userId: user.id, kind: "MOBILE" });
      const access = await issueAccessToken(deps, first.session);
      expect((await authenticateAccessToken(deps, access)).user.id).toBe(user.id);

      const second = await rotateRefreshToken(deps, first.token);
      expect(second.refreshToken).not.toBe(first.token);
      // Reusing the old refresh token = theft signal → everything in the family is revoked.
      await expectCode(rotateRefreshToken(deps, first.token), "SESSION_EXPIRED");
      await expectCode(rotateRefreshToken(deps, second.refreshToken), "SESSION_EXPIRED");
      await expectCode(authenticateAccessToken(deps, second.accessToken), "SESSION_EXPIRED");
    });

    it("rejects tampered access tokens", async () => {
      const { user } = await signIn(phone());
      const { session } = await createSession(deps, { userId: user.id, kind: "MOBILE" });
      const token = await issueAccessToken(deps, session);
      await expectCode(authenticateAccessToken(deps, token.slice(0, -2) + "xx"), "SESSION_EXPIRED");
    });

    it("supports optional password login", async () => {
      const p = phone();
      const { user } = await signIn(p);
      await expectCode(loginWithPassword(deps, p, "whatever-123"), "UNAUTHENTICATED");
      await setPassword(deps, user.id, "correct horse battery");
      const stored = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
      expect((await loginWithPassword(deps, p, "correct horse battery")).id).toBe(user.id);
      await expectCode(loginWithPassword(deps, p, "wrong"), "UNAUTHENTICATED");
    });
  });

  describe("gyms, RBAC and isolation", () => {
    let ownerA: string;
    let ownerB: string;
    let gymA: string;
    let gymB: string;

    beforeAll(async () => {
      clock = new Date();
      ownerA = (await signIn(phone())).user.id;
      ownerB = (await signIn(phone())).user.id;
      gymA = (await registerGym(deps, ownerA, { name: "باشگاه الف", firstBranchName: "مرکزی" })).id;
      gymB = (await registerGym(deps, ownerB, { name: "باشگاه ب", firstBranchName: "اصلی" })).id;
    });

    it("makes the registering user the owner with every permission and a trial plan", async () => {
      const ctx = await loadTenantContext(db, ownerA, gymA);
      expect(ctx.roles).toEqual(["GYM_OWNER"]);
      expect(ctx.permissions.has("settings.manage")).toBe(true);
      expect(ctx.branchIds).toBeNull();
      expect(ctx.modules.has("core")).toBe(true);
      expect(ctx.gymStatus).toBe("TRIAL");
      const audit = await db.auditLog.count({ where: { gymId: gymA, action: "gym.register" } });
      expect(audit).toBe(0); // runtime role cannot read audit rows without a tenant context
    });

    it("lists only the user's own gyms", async () => {
      const gyms = await listMyGyms(deps, ownerA);
      expect(gyms.map((g) => g.id)).toEqual([gymA]);
    });

    it("refuses a context for a gym the user does not belong to", async () => {
      await expectCode(loadTenantContext(db, ownerA, gymB), "FORBIDDEN");
    });

    it("refuses switching a session to someone else's gym", async () => {
      const { session } = await createSession(deps, { userId: ownerA, kind: "WEB" });
      await expectCode(setActiveGym(deps, session, gymB), "FORBIDDEN");
      await setActiveGym(deps, session, gymA);
    });

    it("enforces the plan's branch limit", async () => {
      const ctx = await loadTenantContext(db, ownerA, gymA);
      expect(ctx.planLimits.branches).toBe(1);
      await expectCode(createBranch(deps, ctx, { name: "دوم" }), "BUSINESS_RULE");
    });

    it("scopes a receptionist to their branch and denies staff management", async () => {
      const ownerCtx = await loadTenantContext(db, ownerA, gymA);
      const [branch] = await listBranches(deps, ownerCtx);
      const recPhone = phone();
      const invited = await inviteStaff(deps, ownerCtx, { phone: recPhone, role: "RECEPTIONIST", branchIds: [branch!.id] });
      const recCtx = await loadTenantContext(db, invited.userId, gymA);
      expect(recCtx.branchIds).toEqual([branch!.id]);
      expect(recCtx.permissions.has("members.create")).toBe(true);
      expect(recCtx.permissions.has("finance.manage")).toBe(false);
      await expectCode(listStaff(deps, recCtx), "FORBIDDEN");
      await expectCode(inviteStaff(deps, recCtx, { phone: phone(), role: "COACH", branchIds: [] }), "FORBIDDEN");

      const staff = await listStaff(deps, ownerCtx);
      expect(staff.find((s) => s.phone === recPhone)?.branchIds).toEqual([branch!.id]);
    });

    it("rejects a branch from another gym and duplicate invites", async () => {
      const ctxA = await loadTenantContext(db, ownerA, gymA);
      const ctxB = await loadTenantContext(db, ownerB, gymB);
      const [branchB] = await listBranches(deps, ctxB);
      await expectCode(
        inviteStaff(deps, ctxA, { phone: phone(), role: "RECEPTIONIST", branchIds: [branchB!.id] }),
        "VALIDATION_FAILED"
      );
      const p = phone();
      await inviteStaff(deps, ctxA, { phone: p, role: "COACH", branchIds: [] });
      await expectCode(inviteStaff(deps, ctxA, { phone: p, role: "COACH", branchIds: [] }), "CONFLICT");
    });

    it("only lets the owner appoint gym managers", async () => {
      const ownerCtx = await loadTenantContext(db, ownerA, gymA);
      const mgr = await inviteStaff(deps, ownerCtx, { phone: phone(), role: "GYM_MANAGER", branchIds: [] });
      const mgrCtx = await loadTenantContext(db, mgr.userId, gymA);
      expect(mgrCtx.permissions.has("staff.manage")).toBe(true);
      await expectCode(inviteStaff(deps, mgrCtx, { phone: phone(), role: "GYM_MANAGER", branchIds: [] }), "FORBIDDEN");
    });

    it("never returns another gym's branches or staff", async () => {
      const ctxA = await loadTenantContext(db, ownerA, gymA);
      const branches = await listBranches(deps, ctxA);
      const staff = await listStaff(deps, ctxA);
      const gymBBranchIds = (await listBranches(deps, await loadTenantContext(db, ownerB, gymB))).map((b) => b.id);
      expect(branches.some((b) => gymBBranchIds.includes(b.id))).toBe(false);
      expect(staff.some((s) => s.userId === ownerB)).toBe(false);
    });

    it("blocks writes when a gym is suspended", async () => {
      await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`;
        await tx.gym.update({ where: { id: gymB }, data: { status: "SUSPENDED" } });
      });
      const ctxB = await loadTenantContext(db, ownerB, gymB);
      await expectCode(inviteStaff(deps, ctxB, { phone: phone(), role: "COACH", branchIds: [] }), "GYM_SUSPENDED");
    });
  });
});
