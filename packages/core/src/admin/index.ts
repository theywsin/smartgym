import { withSystem, type Tx } from "@smartgym/db";
import type { AdminGymListInput, AdminSetGymPlanInput, AdminSetGymStatusInput } from "@smartgym/validation";
import { AppError, notFound } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { writeAudit } from "../audit";

/**
 * Platform (super admin) operations. Super admin is a flag on the user row, checked against the
 * database on every call; it is granted only from the server CLI (`npm run superadmin`), never via the API.
 * Everything here bypasses RLS, so every change writes an audit row.
 */
export type AdminActor = { userId: string; ip?: string | null; userAgent?: string | null };

async function requireSuperAdmin(tx: Tx, actor: AdminActor) {
  const u = await tx.user.findUnique({ where: { id: actor.userId }, select: { isSuperAdmin: true, status: true } });
  if (!u?.isSuperAdmin || u.status !== "ACTIVE") throw new AppError("FORBIDDEN", "این بخش فقط برای مدیر پلتفرم است.");
}

const DAY = 86_400_000;
const LIVE_SUB = ["TRIALING", "ACTIVE", "PAST_DUE"] as const;

export async function adminOverview(deps: CoreDeps, actor: AdminActor) {
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const [byStatus, members, newGyms, activeSubs] = await Promise.all([
      tx.gym.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { _all: true } }),
      tx.member.count({ where: { archivedAt: null } }),
      tx.gym.count({ where: { deletedAt: null, createdAt: { gte: new Date(now.getTime() - 30 * DAY) } } }),
      tx.gymSubscription.findMany({ where: { status: { in: [...LIVE_SUB] }, endsAt: { gt: now } }, select: { status: true, plan: { select: { monthlyAmountRial: true } } } }),
    ]);
    return {
      gymsByStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
      members,
      newGymsLast30Days: newGyms,
      paying: activeSubs.filter((s) => s.status === "ACTIVE").length,
      trialing: activeSubs.filter((s) => s.status === "TRIALING").length,
      mrrRial: activeSubs.filter((s) => s.status === "ACTIVE").reduce((a, s) => a + s.plan.monthlyAmountRial, 0n),
    };
  });
}

export async function adminListGyms(deps: CoreDeps, actor: AdminActor, input: AdminGymListInput) {
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const q = input.q?.trim();
    const where = {
      deletedAt: null,
      ...(input.status ? { status: input.status } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { slug: { contains: q } }, { owner: { phone: { contains: q } } }] } : {}),
    };
    const [total, gyms] = await Promise.all([
      tx.gym.count({ where }),
      tx.gym.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: {
          owner: { select: { phone: true } },
          _count: { select: { members: { where: { archivedAt: null } }, branches: { where: { deletedAt: null } } } },
          subscriptions: { where: { status: { in: [...LIVE_SUB] }, endsAt: { gt: now } }, orderBy: { endsAt: "desc" }, take: 1, include: { plan: { select: { key: true, nameFa: true } } } },
        },
      }),
    ]);
    return {
      total, page: input.page, pageSize: input.pageSize,
      items: gyms.map((g) => {
        const s = g.subscriptions[0];
        return {
          id: g.id, name: g.name, slug: g.slug, status: g.status, createdAt: g.createdAt,
          ownerPhone: g.owner.phone, members: g._count.members, branches: g._count.branches,
          subscription: s ? { planKey: s.plan.key, planName: s.plan.nameFa, status: s.status, endsAt: s.endsAt } : null,
        };
      }),
    };
  });
}

export async function adminListPlans(deps: CoreDeps, actor: AdminActor) {
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    return tx.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { monthlyAmountRial: "asc" }, select: { key: true, nameFa: true, monthlyAmountRial: true } });
  });
}

export async function adminSetGymStatus(deps: CoreDeps, actor: AdminActor, gymId: string, input: AdminSetGymStatusInput) {
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const gym = await tx.gym.findFirst({ where: { id: gymId, deletedAt: null }, select: { id: true, status: true } });
    if (!gym) throw notFound("باشگاه");
    if (gym.status === input.status) return { id: gym.id, status: gym.status };
    const updated = await tx.gym.update({ where: { id: gym.id }, data: { status: input.status }, select: { id: true, status: true } });
    await writeAudit(tx, {
      gymId: gym.id, actorUserId: actor.userId, actorRole: "SUPER_ADMIN",
      action: "platform.gym_status", entityType: "gym", entityId: gym.id,
      before: { status: gym.status }, after: { status: input.status, reason: input.reason },
      ip: actor.ip, userAgent: actor.userAgent,
    });
    return updated;
  });
}

/** Replaces the gym's live SaaS subscription with a paid period on the chosen plan, starting now. */
export async function adminSetGymPlan(deps: CoreDeps, actor: AdminActor, gymId: string, input: AdminSetGymPlanInput) {
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const gym = await tx.gym.findFirst({ where: { id: gymId, deletedAt: null }, select: { id: true, status: true } });
    if (!gym) throw notFound("باشگاه");
    const plan = await tx.subscriptionPlan.findFirst({ where: { key: input.planKey, isActive: true } });
    if (!plan) throw notFound("پلن");
    await tx.$queryRaw`SELECT id FROM "gym" WHERE id = ${gym.id}::uuid FOR UPDATE`;
    const live = await tx.gymSubscription.findMany({ where: { gymId: gym.id, status: { in: [...LIVE_SUB] }, endsAt: { gt: now } }, select: { id: true, status: true, endsAt: true, planId: true } });
    if (live.length) await tx.gymSubscription.updateMany({ where: { id: { in: live.map((s) => s.id) } }, data: { status: "CANCELLED", cancelAt: now } });
    const sub = await tx.gymSubscription.create({
      data: {
        gymId: gym.id, planId: plan.id, status: "ACTIVE", period: input.months >= 12 ? "ANNUAL" : "MONTHLY",
        startsAt: now, endsAt: new Date(now.getTime() + input.months * 30 * DAY),
      },
    });
    if (gym.status === "TRIAL") await tx.gym.update({ where: { id: gym.id }, data: { status: "ACTIVE" } });
    await writeAudit(tx, {
      gymId: gym.id, actorUserId: actor.userId, actorRole: "SUPER_ADMIN",
      action: "platform.gym_plan", entityType: "gym_subscription", entityId: sub.id,
      before: live.map((s) => ({ id: s.id, status: s.status, planId: s.planId, endsAt: s.endsAt.toISOString() })),
      after: { planKey: plan.key, months: input.months, endsAt: sub.endsAt.toISOString(), note: input.note },
      ip: actor.ip, userAgent: actor.userAgent,
    });
    return { id: sub.id, planKey: plan.key, endsAt: sub.endsAt };
  });
}
