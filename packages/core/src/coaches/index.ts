import { withTenant, type Tx } from "@smartgym/db";
import type { UpdateCoachInput } from "@smartgym/validation";
import { AppError, notFound } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { writeAudit } from "../audit";
import { type TenantContext, requirePermission, requireWritableGym, primaryRole } from "../rbac/access";
import { findAccessibleMember } from "../members";

async function coachMemberships(tx: Tx, ctx: TenantContext, userIds?: string[]) {
  return tx.gymMembership.findMany({
    where: { gymId: ctx.gymId, status: "ACTIVE", role: { key: "COACH" }, ...(userIds ? { userId: { in: userIds } } : {}) },
    include: { user: { select: { id: true, phone: true, profile: { select: { firstName: true, lastName: true } } } } },
    orderBy: { createdAt: "asc" },
  });
}

/** Coaches are gym members with the COACH role; CoachProfile holds their gym-specific details. */
export async function listCoaches(deps: CoreDeps, ctx: TenantContext) {
  requirePermission(ctx, "coaches.read");
  return withTenant(deps.db, ctx, async (tx) => {
    const ms = await coachMemberships(tx, ctx);
    const ids = ms.map((m) => m.userId);
    const [profiles, counts] = await Promise.all([
      tx.coachProfile.findMany({ where: { gymId: ctx.gymId, userId: { in: ids } } }),
      tx.coachAthlete.groupBy({ by: ["coachUserId"], where: { gymId: ctx.gymId, endedAt: null, coachUserId: { in: ids } }, _count: true }),
    ]);
    const profile = new Map(profiles.map((p) => [p.userId, p]));
    const count = new Map(counts.map((c) => [c.coachUserId, c._count]));
    return ms.map((m) => ({
      userId: m.userId,
      phone: m.user.phone,
      firstName: m.user.profile?.firstName ?? null,
      lastName: m.user.profile?.lastName ?? null,
      bio: profile.get(m.userId)?.bio ?? null,
      specializations: profile.get(m.userId)?.specializations ?? [],
      commissionRateBp: profile.get(m.userId)?.commissionRateBp ?? null,
      activeAthletes: count.get(m.userId) ?? 0,
    }));
  });
}

export async function updateCoach(deps: CoreDeps, ctx: TenantContext, coachUserId: string, input: UpdateCoachInput) {
  requirePermission(ctx, "coaches.manage");
  requireWritableGym(ctx);
  return withTenant(deps.db, ctx, async (tx) => {
    if ((await coachMemberships(tx, ctx, [coachUserId])).length === 0) throw notFound("مربی");
    const data = {
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.specializations !== undefined && { specializations: [...new Set(input.specializations)] }),
      ...(input.commissionRateBp !== undefined && { commissionRateBp: input.commissionRateBp }),
    };
    const p = await tx.coachProfile.upsert({
      where: { gymId_userId: { gymId: ctx.gymId, userId: coachUserId } },
      update: data,
      create: { gymId: ctx.gymId, userId: coachUserId, ...data },
    });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "coach.update", entityType: "coach_profile", entityId: p.id,
      after: { specializations: p.specializations, commissionRateBp: p.commissionRateBp },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return p;
  });
}

/** Sets (or clears, with null) a member's coach. The previous assignment is ended, never deleted. */
export async function assignCoach(deps: CoreDeps, ctx: TenantContext, memberId: string, coachUserId: string | null) {
  requirePermission(ctx, "coaches.manage");
  requireWritableGym(ctx);
  const now = nowOf(deps);
  return withTenant(deps.db, ctx, async (tx) => {
    const member = await findAccessibleMember(tx, ctx, memberId);
    if (member.status !== "ACTIVE") throw new AppError("BUSINESS_RULE", "این عضو بایگانی شده است.");
    await tx.$queryRaw`SELECT id FROM "member" WHERE id = ${member.id}::uuid FOR UPDATE`;
    if (coachUserId && (await coachMemberships(tx, ctx, [coachUserId])).length === 0) {
      const msg = "مربی انتخاب‌شده در این باشگاه فعال نیست.";
      throw new AppError("VALIDATION_FAILED", msg, { fields: { coachUserId: [msg] } });
    }
    const current = await tx.coachAthlete.findFirst({ where: { gymId: ctx.gymId, memberId, endedAt: null } });
    if (current?.coachUserId === coachUserId) return current;
    if (current) await tx.coachAthlete.update({ where: { id: current.id }, data: { endedAt: now } });
    const next = coachUserId
      ? await tx.coachAthlete.create({ data: { gymId: ctx.gymId, coachUserId, memberId, startedAt: now, assignedBy: ctx.userId } })
      : null;
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "member.assign_coach", entityType: "member", entityId: memberId,
      before: { coachUserId: current?.coachUserId ?? null }, after: { coachUserId },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return next;
  });
}
