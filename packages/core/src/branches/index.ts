import { withTenant } from "@smartgym/db";
import type { CreateBranchInput } from "@smartgym/validation";
import { toPersianDigits } from "@smartgym/shared";
import { AppError } from "../errors";
import type { CoreDeps } from "../deps";
import { writeAudit } from "../audit";
import { type TenantContext, requirePermission, requireWritableGym, primaryRole } from "../rbac/access";

export async function listBranches(deps: CoreDeps, ctx: TenantContext) {
  requirePermission(ctx, "branches.read");
  return withTenant(deps.db, ctx, (tx) =>
    tx.branch.findMany({
      where: {
        gymId: ctx.gymId,
        deletedAt: null,
        ...(ctx.branchIds ? { id: { in: [...ctx.branchIds] } } : {}),
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, address: true, phone: true, isActive: true, createdAt: true },
    })
  );
}

export async function createBranch(deps: CoreDeps, ctx: TenantContext, input: CreateBranchInput) {
  requirePermission(ctx, "branches.manage");
  requireWritableGym(ctx);
  return withTenant(deps.db, ctx, async (tx) => {
    const limit = ctx.planLimits.branches;
    if (typeof limit === "number") {
      const count = await tx.branch.count({ where: { gymId: ctx.gymId, deletedAt: null } });
      if (count >= limit) {
        throw new AppError("BUSINESS_RULE", `اشتراک فعلی حداکثر ${toPersianDigits(limit)} شعبه را پشتیبانی می‌کند. برای شعبه بیشتر اشتراک را ارتقا دهید.`);
      }
    }
    const branch = await tx.branch.create({ data: { gymId: ctx.gymId, ...input } });
    await writeAudit(tx, {
      gymId: ctx.gymId,
      actorUserId: ctx.userId,
      actorRole: primaryRole(ctx),
      action: "branch.create",
      entityType: "branch",
      entityId: branch.id,
      after: { name: branch.name },
      ip: ctx.meta?.ip,
      userAgent: ctx.meta?.userAgent,
    });
    return branch;
  });
}
