import crypto from "node:crypto";
import { withSystem, withUser, type Gym } from "@smartgym/db";
import type { RegisterGymInput } from "@smartgym/validation";
import { AppError } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { writeAudit } from "../audit";


/**
 * Self-service gym registration for a verified user: creates the gym (TRIAL), makes the
 * user its owner, adds the first branch and starts the trial subscription — atomically.
 */
export async function registerGym(
  deps: CoreDeps,
  userId: string,
  input: RegisterGymInput,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<Gym> {
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => {
    const signup = await tx.platformSetting.findUnique({ where: { key: "signup" } });
    const sv = (signup?.value ?? {}) as { allowGymSignup?: boolean; trialPlanKey?: string };
    if (sv.allowGymSignup === false) throw new AppError("FORBIDDEN", "ثبت باشگاه جدید فعلاً بسته است. با پشتیبانی تماس بگیرید.");
    const owned = await tx.gym.count({ where: { ownerUserId: userId, deletedAt: null } });
    if (owned >= deps.config.maxOwnedGyms) {
      throw new AppError("BUSINESS_RULE", "به حداکثر تعداد باشگاه برای یک حساب رسیده‌اید. با پشتیبانی تماس بگیرید.");
    }

    const slug = input.slug ?? `gym-${crypto.randomBytes(4).toString("hex")}`;
    if (await tx.gym.findUnique({ where: { slug }, select: { id: true } })) {
      const msg = "این شناسه قبلاً استفاده شده است.";
      throw new AppError("CONFLICT", msg, { fields: { slug: [msg] } });
    }

    const ownerRole = await tx.role.findFirstOrThrow({ where: { key: "GYM_OWNER", gymId: null } });
    const gym = await tx.gym.create({ data: { name: input.name, slug, ownerUserId: userId, status: "TRIAL" } });
    await tx.gymMembership.create({ data: { gymId: gym.id, userId, roleId: ownerRole.id } });
    const branch = await tx.branch.create({ data: { gymId: gym.id, name: input.firstBranchName } });

    if (input.firstName || input.lastName) {
      await tx.userProfile.upsert({
        where: { userId },
        update: { firstName: input.firstName, lastName: input.lastName },
        create: { userId, firstName: input.firstName, lastName: input.lastName },
      });
    }

    const plan = await tx.subscriptionPlan.findUnique({ where: { key: sv.trialPlanKey ?? "starter" } });
    if (plan) {
      const trialEnds = new Date(now.getTime() + plan.trialDays * 86_400_000);
      await tx.gymSubscription.create({
        data: { gymId: gym.id, planId: plan.id, status: "TRIALING", startsAt: now, endsAt: trialEnds, trialEndsAt: trialEnds },
      });
    }

    await writeAudit(tx, {
      gymId: gym.id,
      actorUserId: userId,
      actorRole: "GYM_OWNER",
      action: "gym.register",
      entityType: "gym",
      entityId: gym.id,
      after: { name: gym.name, slug: gym.slug, branchId: branch.id, plan: plan?.key ?? null },
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return gym;
  });
}

/** Gyms the user can switch into, with their roles. */
export async function listMyGyms(deps: CoreDeps, userId: string) {
  const memberships = await withUser(deps.db, userId, (tx) =>
    tx.gymMembership.findMany({
      where: { userId, status: "ACTIVE", gym: { deletedAt: null } },
      include: { gym: { select: { id: true, name: true, slug: true, status: true } }, role: { select: { key: true } } },
      orderBy: { createdAt: "asc" },
    })
  );
  const byGym = new Map<string, { id: string; name: string; slug: string; status: string; roles: string[] }>();
  for (const m of memberships) {
    const entry = byGym.get(m.gymId) ?? { ...m.gym, roles: [] };
    entry.roles.push(m.role.key);
    byGym.set(m.gymId, entry);
  }
  return [...byGym.values()];
}
