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

  it("isolates Phase 2 tables (members, plans, subscriptions, attendance)", async () => {
    const created = await withSystem(app, async (tx) => {
      const last = await tx.member.findFirst({ where: { gymId: gymB.id }, orderBy: { code: "desc" }, select: { code: true } });
      const member = await tx.member.create({ data: { gymId: gymB.id, code: (last?.code ?? 1000) + 1, firstName: "rls", lastName: "test" } });
      const plan = await tx.membershipPlan.create({ data: { gymId: gymB.id, name: "rls", durationDays: 30, priceAmountRial: 1n } });
      return { member, plan };
    });
    const seen = await withTenant(app, { gymId: gymA.id }, async (tx) => ({
      members: await tx.member.count({ where: { id: created.member.id } }),
      plans: await tx.membershipPlan.count({ where: { id: created.plan.id } }),
      subs: await tx.memberSubscription.count({ where: { gymId: gymB.id } }),
      visits: await tx.attendance.count({ where: { gymId: gymB.id } }),
    }));
    expect(seen).toEqual({ members: 0, plans: 0, subs: 0, visits: 0 });
    await expect(
      withTenant(app, { gymId: gymA.id }, (tx) => tx.member.update({ where: { id: created.member.id }, data: { firstName: "hijack" } }))
    ).rejects.toThrow();
    await expect(
      withTenant(app, { gymId: gymA.id }, (tx) => tx.membershipPlan.create({ data: { gymId: gymB.id, name: "x", durationDays: 1, priceAmountRial: 1n } }))
    ).rejects.toThrow();
  });
});
