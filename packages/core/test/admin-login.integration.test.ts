/** Platform admin username + password login. Requires DATABASE_URL (app role) and an owner URL for setup. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";
import { createPrismaClient, type PrismaClient } from "@smartgym/db";
import { AppError, ConsoleSmsProvider, DEFAULT_CONFIG, type CoreDeps, loginAdmin, upsertPlatformAdmin, createSession, authenticateWebSession, adminOverview } from "../src";

const hasDb = !!process.env.DATABASE_URL;
const ownerUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL?.replace("smartgym_app:app", "smartgym_owner:owner");

describe.skipIf(!hasDb)("platform admin login", () => {
  let db: PrismaClient;
  let owner: PrismaClient;
  let deps: CoreDeps;
  const username = `adm_${crypto.randomInt(1e6, 9e6)}`;
  const password = "correct-horse-battery";

  beforeAll(async () => {
    db = createPrismaClient(process.env.DATABASE_URL);
    owner = createPrismaClient(ownerUrl);
    deps = { db, sms: new ConsoleSmsProvider(), config: { ...DEFAULT_CONFIG, otpPepper: "test-pepper-0123456789-0123456789", jwtSecret: "test-jwt-secret-0123456789-0123456789" } };
    await upsertPlatformAdmin(owner, username, password);
  });
  afterAll(async () => { await db?.$disconnect(); await owner?.$disconnect(); });

  it("signs in with the right password only, case-insensitive username", async () => {
    const u = await loginAdmin(deps, username.toUpperCase(), password);
    expect(u.isSuperAdmin).toBe(true);
    for (const [n, p] of [[username, "wrong-password-123"], ["nobody_here", password], ["bad name!", password]]) {
      await expect(loginAdmin(deps, n!, p!)).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === "UNAUTHENTICATED");
    }
  });

  it("admin sessions authenticate and reach admin functions; password change revokes them", async () => {
    const u = await loginAdmin(deps, username, password);
    const { token } = await createSession(deps, { userId: u.id, kind: "ADMIN" });
    const auth = await authenticateWebSession(deps, token);
    expect(auth.session.kind).toBe("ADMIN");
    await adminOverview(deps, { userId: u.id });
    await upsertPlatformAdmin(owner, username, "another-strong-pass");
    await expect(authenticateWebSession(deps, token)).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === "SESSION_EXPIRED");
  });

  it("rejects weak input in the CLI helper", async () => {
    await expect(upsertPlatformAdmin(owner, "ok_name", "short")).rejects.toThrow();
    await expect(upsertPlatformAdmin(owner, "x", "long-enough-pass")).rejects.toThrow();
  });
});
