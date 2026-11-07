/**
 * Proves Postgres row-level security isolates gyms for the runtime role.
 * Needs DATABASE_URL (runtime role, e.g. smartgym_app) and MIGRATION_DATABASE_URL (owner),
 * with migrations applied and `SEED_DEV=true` seed data present.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createPrismaClient, withTenant, withUser, withSystem, type PrismaClient } from "../src/index";

const hasDb = !!process.env.DATABASE_URL;
let app: PrismaClient;
let gymA: { id: string; ownerUserId: string };
let gymB: { id: string; ownerUserId: string };

describe.skipIf(!hasDb)("row-level security", () => {
  beforeAll(async () => {
    app = createPrismaClient(process.env.DATABASE_URL);
    const gyms = await withSystem(app, (tx) =>
      tx.gym.findMany({ where: { slug: { in: ["demo-arian", "demo-negin"] } }, orderBy: { slug: "asc" } })
    );
    expect(gyms).toHaveLength(2);
    gymA = gyms[0]!;
    gymB = gyms[1]!;
  });

  afterAll(async () => {
    await app?.$disconnect();
  });

  it("returns nothing without a tenant context", async () => {
    expect(await app.branch.count()).toBe(0);
    expect(await app.gym.count()).toBe(0);
  });

  it("only shows the active gym's rows", async () => {
    const branches = await withTenant(app, { gymId: gymA.id }, (tx) => tx.branch.findMany());
    expect(branches.length).toBeGreaterThan(0);
    expect(branches.every((b) => b.gymId === gymA.id)).toBe(true);
  });

  it("ignores an explicit filter for another gym", async () => {
    const leaked = await withTenant(app, { gymId: gymA.id }, (tx) => tx.branch.findMany({ where: { gymId: gymB.id } }));
    expect(leaked).toHaveLength(0);
  });

  it("rejects writes into another gym", async () => {
    await expect(
      withTenant(app, { gymId: gymA.id }, (tx) => tx.branch.create({ data: { gymId: gymB.id, name: "hijack" } }))
    ).rejects.toThrow();
  });

  it("lets a user see only the gyms they belong to", async () => {
    const gyms = await withUser(app, gymA.ownerUserId, (tx) => tx.gym.findMany());
    expect(gyms.map((g) => g.id)).toEqual([gymA.id]);
  });

  it("keeps the audit log append-only", async () => {
    await withTenant(app, { gymId: gymA.id }, (tx) =>
      tx.auditLog.create({ data: { gymId: gymA.id, action: "test.write", entityType: "test" } })
    );
    await expect(
      withTenant(app, { gymId: gymA.id }, (tx) => tx.auditLog.deleteMany({ where: { action: "test.write" } }))
    ).rejects.toThrow();
  });
});
