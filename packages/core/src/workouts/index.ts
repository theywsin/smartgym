import { withTenant, type Tx } from "@smartgym/db";
import type { WorkoutProgramInput } from "@smartgym/validation";
import { forbidden, notFound } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { writeAudit } from "../audit";
import { type TenantContext, requirePermission, requireWritableGym, primaryRole, hasPermission } from "../rbac/access";
import { findAccessibleMember } from "../members";
import { membershipSummary, SUMMARY_SUBS_INCLUDE } from "../memberships/state";

/** Coaches without coaches.manage work only with their current athletes. */
export async function assertCoachAccess(tx: Tx, ctx: TenantContext, memberId: string) {
  await findAccessibleMember(tx, ctx, memberId);
  if (hasPermission(ctx, "coaches.manage")) return;
  const link = await tx.coachAthlete.findFirst({ where: { gymId: ctx.gymId, memberId, coachUserId: ctx.userId, endedAt: null } });
  if (!link) throw notFound("عضو");
}

/** The signed-in coach's current athletes with membership state and active program title. */
export async function listMyAthletes(deps: CoreDeps, ctx: TenantContext) {
  requirePermission(ctx, "workouts.read");
  const now = nowOf(deps);
  return withTenant(deps.db, ctx, async (tx) => {
    const links = await tx.coachAthlete.findMany({
      where: { gymId: ctx.gymId, coachUserId: ctx.userId, endedAt: null },
      include: { member: { include: { subscriptions: SUMMARY_SUBS_INCLUDE } } },
      orderBy: { startedAt: "desc" },
    });
    const programs = await tx.workoutProgram.findMany({
      where: { gymId: ctx.gymId, isActive: true, memberId: { in: links.map((l) => l.memberId) } },
      select: { memberId: true, title: true, updatedAt: true },
    });
    return links
      .filter((l) => l.member.status === "ACTIVE")
      .map((l) => ({
        memberId: l.memberId,
        code: l.member.code,
        firstName: l.member.firstName,
        lastName: l.member.lastName,
        since: l.startedAt,
        membership: membershipSummary(l.member.subscriptions, now),
        program: programs.find((p) => p.memberId === l.memberId) ?? null,
      }));
  });
}

export async function listPrograms(deps: CoreDeps, ctx: TenantContext, memberId: string) {
  requirePermission(ctx, "workouts.read");
  return withTenant(deps.db, ctx, async (tx) => {
    await assertCoachAccess(tx, ctx, memberId);
    return tx.workoutProgram.findMany({ where: { gymId: ctx.gymId, memberId }, orderBy: { createdAt: "desc" }, take: 20 });
  });
}

/** New program for a member. The previous active one is archived (kept as history). */
export async function createProgram(deps: CoreDeps, ctx: TenantContext, memberId: string, input: WorkoutProgramInput) {
  requirePermission(ctx, "workouts.manage");
  requireWritableGym(ctx);
  const now = nowOf(deps);
  return withTenant(deps.db, ctx, async (tx) => {
    await assertCoachAccess(tx, ctx, memberId);
    await tx.$queryRaw`SELECT id FROM "member" WHERE id = ${memberId}::uuid FOR UPDATE`;
    await tx.workoutProgram.updateMany({ where: { gymId: ctx.gymId, memberId, isActive: true }, data: { isActive: false, archivedAt: now } });
    const p = await tx.workoutProgram.create({
      data: {
        gymId: ctx.gymId, memberId, coachUserId: ctx.userId, title: input.title, goal: input.goal ?? null, notes: input.notes ?? null,
        days: input.days, createdByUserId: ctx.userId,
      },
    });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "workout_program.create", entityType: "workout_program", entityId: p.id,
      after: { memberId, title: p.title, days: input.days.length },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return p;
  });
}

/** Edits the active program in place (small corrections). Archived programs are read-only. */
export async function updateProgram(deps: CoreDeps, ctx: TenantContext, programId: string, input: WorkoutProgramInput) {
  requirePermission(ctx, "workouts.manage");
  requireWritableGym(ctx);
  return withTenant(deps.db, ctx, async (tx) => {
    const p = await tx.workoutProgram.findFirst({ where: { id: programId, gymId: ctx.gymId } });
    if (!p) throw notFound("برنامه");
    await assertCoachAccess(tx, ctx, p.memberId);
    if (!p.isActive) throw forbidden();
    const updated = await tx.workoutProgram.update({
      where: { id: p.id },
      data: { title: input.title, goal: input.goal ?? null, notes: input.notes ?? null, days: input.days },
    });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "workout_program.update", entityType: "workout_program", entityId: p.id,
      before: { title: p.title, days: p.days as never }, after: { title: updated.title, days: input.days },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return updated;
  });
}
