import { withSystem } from "@smartgym/db";
import type { AdminGymUpdateInput } from "@smartgym/validation";
import { AppError, notFound } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { hashPassword } from "../auth/crypto";
import type { AdminActor } from "./index";
import { adminAudit, requireSuperAdmin } from "./platform";

const SAMAN_KEY = "payments.saman";
const DAY = 86_400_000;

/** Everything a platform admin needs about one gym. Bypasses RLS (super admin only). */
export async function adminGetGym(deps: CoreDeps, actor: AdminActor, gymId: string) {
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const g = await tx.gym.findFirst({
      where: { id: gymId, deletedAt: null },
      include: {
        owner: { select: { id: true, phone: true, profile: { select: { firstName: true, lastName: true } } } },
        branches: { where: { deletedAt: null }, select: { id: true, name: true, address: true, phone: true, isActive: true }, orderBy: { createdAt: "asc" } },
        memberships: { where: { status: "ACTIVE" }, select: { user: { select: { id: true, phone: true, profile: { select: { firstName: true, lastName: true } } } }, role: { select: { key: true, nameFa: true } } } },
        subscriptions: { orderBy: { startsAt: "desc" }, take: 10, include: { plan: { select: { key: true, nameFa: true } } } },
      },
    });
    if (!g) throw notFound("باشگاه");
    const since = new Date(now.getTime() - 30 * DAY);
    const [members, activeMembers, pay30, payAll, saman] = await Promise.all([
      tx.member.count({ where: { gymId, archivedAt: null } }),
      tx.memberSubscription.count({ where: { gymId, status: "ACTIVE" } }),
      tx.payment.aggregate({ where: { gymId, paidAt: { gte: since } }, _sum: { amountRial: true }, _count: true }),
      tx.payment.aggregate({ where: { gymId }, _sum: { amountRial: true }, _count: true }),
      tx.gymSetting.findUnique({ where: { gymId_key: { gymId, key: SAMAN_KEY } } }),
    ]);
    const name = (p: { firstName: string | null; lastName: string | null } | null) => [p?.firstName, p?.lastName].filter(Boolean).join(" ") || null;
    const terminal = (saman?.value as { terminalId?: unknown } | null)?.terminalId;
    return {
      id: g.id, name: g.name, slug: g.slug, status: g.status, createdAt: g.createdAt,
      owner: { id: g.owner.id, phone: g.owner.phone, name: name(g.owner.profile) },
      branches: g.branches,
      staff: g.memberships.map((m) => ({ userId: m.user.id, phone: m.user.phone, name: name(m.user.profile), role: m.role.nameFa ?? m.role.key })),
      subscriptions: g.subscriptions.map((s) => ({ id: s.id, plan: s.plan.nameFa, planKey: s.plan.key, status: s.status, startsAt: s.startsAt, endsAt: s.endsAt })),
      stats: {
        members, activeMemberSubs: activeMembers,
        payments30d: { count: pay30._count, rial: String(pay30._sum.amountRial ?? 0n) },
        paymentsAll: { count: payAll._count, rial: String(payAll._sum.amountRial ?? 0n) },
      },
      terminalId: typeof terminal === "string" && terminal ? terminal : null,
    };
  });
}

export async function adminUpdateGym(deps: CoreDeps, actor: AdminActor, gymId: string, input: AdminGymUpdateInput) {
  await withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const g = await tx.gym.findFirst({ where: { id: gymId, deletedAt: null }, select: { id: true, name: true } });
    if (!g) throw notFound("باشگاه");
    const before = await tx.gymSetting.findUnique({ where: { gymId_key: { gymId, key: SAMAN_KEY } } });
    await tx.gym.update({ where: { id: gymId }, data: { name: input.name } });
    const value = { terminalId: input.terminalId };
    await tx.gymSetting.upsert({ where: { gymId_key: { gymId, key: SAMAN_KEY } }, create: { gymId, key: SAMAN_KEY, value }, update: { value } });
    await adminAudit(tx, actor, "platform.gym_update", "gym", gymId, { name: g.name, terminalId: (before?.value as { terminalId?: string } | null)?.terminalId ?? null }, input);
  });
  return adminGetGym(deps, actor, gymId);
}

export async function adminGetUser(deps: CoreDeps, actor: AdminActor, userId: string) {
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const u = await tx.user.findUnique({
      where: { id: userId },
      include: {
        profile: { select: { firstName: true, lastName: true } },
        memberships: { select: { status: true, gym: { select: { id: true, name: true } }, role: { select: { key: true, nameFa: true } } } },
        ownedGyms: { where: { deletedAt: null }, select: { id: true, name: true, status: true } },
        sessions: { where: { revokedAt: null, expiresAt: { gt: now } }, orderBy: { lastUsedAt: "desc" }, take: 20, select: { id: true, kind: true, deviceName: true, ip: true, userAgent: true, lastUsedAt: true, createdAt: true } },
      },
    });
    if (!u) throw notFound("کاربر");
    return {
      id: u.id, phone: u.phone, status: u.status, isSuperAdmin: u.isSuperAdmin, adminUsername: u.adminUsername,
      createdAt: u.createdAt, lastLoginAt: u.lastLoginAt, hasPassword: !!u.passwordHash,
      name: [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(" ") || null,
      memberships: u.memberships.map((m) => ({ gymId: m.gym.id, gym: m.gym.name, role: m.role.nameFa ?? m.role.key, status: m.status })),
      ownedGyms: u.ownedGyms,
      sessions: u.sessions,
    };
  });
}

/** Sets a user's password (so they can sign in with phone + password) and signs them out everywhere. */
export async function adminSetUserPassword(deps: CoreDeps, actor: AdminActor, userId: string, password: string) {
  const hash = await hashPassword(password);
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const u = await tx.user.findUnique({ where: { id: userId }, select: { id: true, isSuperAdmin: true } });
    if (!u) throw notFound("کاربر");
    if (u.isSuperAdmin && u.id !== actor.userId) throw new AppError("BUSINESS_RULE", "رمز مدیر پلتفرم دیگر را از اینجا نمی‌توان تغییر داد.");
    await tx.user.update({ where: { id: u.id }, data: { passwordHash: hash } });
    await tx.session.updateMany({ where: { userId: u.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await adminAudit(tx, actor, "platform.user_password", "user", u.id, null, { passwordChanged: true });
    return { ok: true };
  });
}

export async function adminRevokeUserSessions(deps: CoreDeps, actor: AdminActor, userId: string) {
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const r = await tx.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await adminAudit(tx, actor, "platform.user_sessions_revoke", "user", userId, null, { revoked: r.count });
    return { revoked: r.count };
  });
}
