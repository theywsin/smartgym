import { withTenant } from "@smartgym/db";
import { BRANCH_SCOPED_ROLES, type GymRole } from "@smartgym/shared";
import type { InviteStaffInput } from "@smartgym/validation";
import { AppError, forbidden } from "../errors";
import type { CoreDeps } from "../deps";
import { writeAudit } from "../audit";
import { type TenantContext, requirePermission, requireWritableGym, primaryRole } from "../rbac/access";

/** Staff = everyone in the gym except athletes. */
export async function listStaff(deps: CoreDeps, ctx: TenantContext) {
  requirePermission(ctx, "staff.read");
  return withTenant(deps.db, ctx, async (tx) => {
    const memberships = await tx.gymMembership.findMany({
      where: { gymId: ctx.gymId, role: { key: { not: "ATHLETE" } } },
      include: {
        role: { select: { key: true } },
        user: { select: { id: true, phone: true, profile: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });
    const staffBranches = await tx.branchStaff.findMany({ where: { gymId: ctx.gymId }, select: { userId: true, branchId: true, roleId: true } });
    return memberships.map((m) => ({
      membershipId: m.id,
      userId: m.user.id,
      phone: m.user.phone,
      firstName: m.user.profile?.firstName ?? null,
      lastName: m.user.profile?.lastName ?? null,
      role: m.role.key,
      status: m.status,
      branchIds: staffBranches.filter((s) => s.userId === m.userId && s.roleId === m.roleId).map((s) => s.branchId),
    }));
  });
}

/**
 * Adds a staff member by phone. The person signs in with an OTP to the same phone;
 * no password is created or sent.
 */
export async function inviteStaff(deps: CoreDeps, ctx: TenantContext, input: InviteStaffInput) {
  requirePermission(ctx, "staff.manage");
  requireWritableGym(ctx);
  // Only the owner (settings.manage) may appoint gym-wide managers.
  if (input.role === "GYM_MANAGER" && !ctx.permissions.has("settings.manage")) throw forbidden();

  const role = input.role as GymRole;
  const needsBranches = BRANCH_SCOPED_ROLES.has(role);
  if (needsBranches && input.branchIds.length === 0) {
    const msg = "برای این نقش حداقل یک شعبه را انتخاب کنید.";
    throw new AppError("VALIDATION_FAILED", msg, { fields: { branchIds: [msg] } });
  }
  // A branch-scoped inviter may only staff their own branches.
  if (ctx.branchIds && input.branchIds.some((b) => !ctx.branchIds!.includes(b))) throw forbidden();

  return withTenant(deps.db, ctx, async (tx) => {
    const roleRow = await tx.role.findFirstOrThrow({ where: { key: role, gymId: null } });

    if (input.branchIds.length > 0) {
      const found = await tx.branch.count({ where: { id: { in: input.branchIds }, gymId: ctx.gymId, deletedAt: null } });
      if (found !== new Set(input.branchIds).size) {
        const msg = "شعبه انتخاب‌شده معتبر نیست.";
        throw new AppError("VALIDATION_FAILED", msg, { fields: { branchIds: [msg] } });
      }
    }

    const user = await tx.user.upsert({ where: { phone: input.phone }, update: {}, create: { phone: input.phone } });
    if (input.firstName || input.lastName) {
      await tx.userProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, firstName: input.firstName, lastName: input.lastName },
      });
    }

    const existing = await tx.gymMembership.findUnique({
      where: { gymId_userId_roleId: { gymId: ctx.gymId, userId: user.id, roleId: roleRow.id } },
    });
    if (existing && existing.status === "ACTIVE") {
      throw new AppError("CONFLICT", "این شخص قبلاً با همین نقش در باشگاه ثبت شده است.");
    }
    const membership = existing
      ? await tx.gymMembership.update({ where: { id: existing.id }, data: { status: "ACTIVE", invitedBy: ctx.userId } })
      : await tx.gymMembership.create({ data: { gymId: ctx.gymId, userId: user.id, roleId: roleRow.id, invitedBy: ctx.userId } });

    if (input.branchIds.length > 0) {
      await tx.branchStaff.createMany({
        data: input.branchIds.map((branchId) => ({ gymId: ctx.gymId, branchId, userId: user.id, roleId: roleRow.id })),
        skipDuplicates: true,
      });
    }

    await writeAudit(tx, {
      gymId: ctx.gymId,
      actorUserId: ctx.userId,
      actorRole: primaryRole(ctx),
      action: "staff.invite",
      entityType: "gym_membership",
      entityId: membership.id,
      after: { userId: user.id, role, branchIds: input.branchIds },
      ip: ctx.meta?.ip,
      userAgent: ctx.meta?.userAgent,
    });
    return { membershipId: membership.id, userId: user.id, phone: user.phone, role, branchIds: input.branchIds };
  });
}
