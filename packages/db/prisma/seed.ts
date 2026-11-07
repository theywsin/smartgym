/**
 * Seeds reference data needed in every environment (idempotent):
 * permissions, system roles, modules, default SaaS plans.
 * With SEED_DEV=true it also creates two demo gyms for local development and
 * isolation testing. Never set SEED_DEV in production.
 */
import { DEFAULT_ROLE_PERMISSIONS, GYM_ROLES, MODULES, PERMISSIONS, ROLE_LABELS_FA } from "@smartgym/shared";
import { createPrismaClient, withSystem, type Tx } from "../src/index";

const PLANS = [
  {
    key: "starter",
    nameFa: "پایه",
    monthlyAmountRial: 15_000_000n,
    annualAmountRial: 150_000_000n,
    trialDays: 14,
    limits: { members: 300, branches: 1, aiTokensPerMonth: 0 },
    modules: ["core", "athlete_app"],
  },
  {
    key: "pro",
    nameFa: "حرفه‌ای",
    monthlyAmountRial: 35_000_000n,
    annualAmountRial: 350_000_000n,
    trialDays: 14,
    limits: { members: 1500, branches: 3, aiTokensPerMonth: 500_000 },
    modules: ["core", "athlete_app", "finance", "store", "buffet", "coaching", "loyalty", "ai"],
  },
  {
    key: "enterprise",
    nameFa: "سازمانی",
    monthlyAmountRial: 80_000_000n,
    annualAmountRial: 800_000_000n,
    trialDays: 14,
    limits: { members: null, branches: null, aiTokensPerMonth: 3_000_000 },
    modules: MODULES.map((m) => m.key),
  },
];

export async function seedBase(tx: Tx): Promise<void> {
  for (const key of PERMISSIONS) {
    await tx.permission.upsert({ where: { key }, update: {}, create: { key } });
  }
  const perms = new Map((await tx.permission.findMany()).map((p) => [p.key, p.id]));

  for (const key of GYM_ROLES) {
    const existing = await tx.role.findFirst({ where: { key, gymId: null } });
    const role = existing ?? (await tx.role.create({ data: { key, nameFa: ROLE_LABELS_FA[key] } }));
    await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
    await tx.rolePermission.createMany({
      data: DEFAULT_ROLE_PERMISSIONS[key].map((p) => ({ roleId: role.id, permissionId: perms.get(p)! })),
    });
  }

  for (const m of MODULES) {
    await tx.module.upsert({ where: { key: m.key }, update: { nameFa: m.nameFa }, create: { key: m.key, nameFa: m.nameFa } });
  }
  const modules = new Map((await tx.module.findMany()).map((m) => [m.key, m.id]));

  for (const plan of PLANS) {
    const { modules: planModules, ...data } = plan;
    const saved = await tx.subscriptionPlan.upsert({
      where: { key: plan.key },
      update: { nameFa: data.nameFa, limits: data.limits },
      create: data,
    });
    await tx.subscriptionPlanModule.deleteMany({ where: { planId: saved.id } });
    await tx.subscriptionPlanModule.createMany({
      data: planModules.map((k) => ({ planId: saved.id, moduleId: modules.get(k)! })),
    });
  }
}

async function main() {
  const db = createPrismaClient(process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL);
  try {
    await withSystem(db, (tx) => seedBase(tx), { timeout: 60_000 });
    console.log("✔ base reference data seeded");
    if (process.env.SEED_DEV === "true") {
      if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed demo data in production");
      const { seedDev } = await import("./seed.dev");
      await seedDev(db);
      console.log("✔ development demo data seeded");
    }
  } finally {
    await db.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
