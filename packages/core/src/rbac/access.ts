import { withTenant, type PrismaClient, type GymStatus } from "@smartgym/db";
import { BRANCH_SCOPED_ROLES, type GymRole, type ModuleKey, type Permission } from "@smartgym/shared";
import { AppError, forbidden } from "../errors";

/**
 * Everything a request may do inside one gym. Built on the server from the session;
 * never from anything the client sends.
 */
export interface TenantContext {
  gymId: string;
  userId: string;
  roles: GymRole[];
  permissions: ReadonlySet<Permission>;
  /** null = all branches of the gym; otherwise only these branches. */
  branchIds: readonly string[] | null;
  gymStatus: GymStatus;
  modules: ReadonlySet<ModuleKey>;
  planLimits: { members?: number | null; branches?: number | null; aiTokensPerMonth?: number | null };
  meta?: { ip?: string | null; userAgent?: string | null };
}

export async function loadTenantContext(
  db: PrismaClient,
  userId: string,
  gymId: string,
  meta?: TenantContext["meta"]
): Promise<TenantContext> {
  return withTenant(db, { gymId, userId }, async (tx) => {
    const gym = await tx.gym.findFirst({ where: { id: gymId, deletedAt: null }, select: { status: true } });
    if (!gym) throw forbidden();

    const memberships = await tx.gymMembership.findMany({
      where: { gymId, userId, status: "ACTIVE" },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    if (memberships.length === 0) throw forbidden();

    const roles = memberships.map((m) => m.role.key as GymRole);
    const permissions = new Set<Permission>();
    for (const m of memberships) for (const rp of m.role.permissions) permissions.add(rp.permission.key as Permission);

    let branchIds: string[] | null = null;
    if (roles.every((r) => BRANCH_SCOPED_ROLES.has(r) || r === "COACH" || r === "ATHLETE") && roles.some((r) => BRANCH_SCOPED_ROLES.has(r))) {
      const staff = await tx.branchStaff.findMany({ where: { gymId, userId }, select: { branchId: true } });
      branchIds = [...new Set(staff.map((s) => s.branchId))];
    }

    const now = new Date();
    const subscription = await tx.gymSubscription.findFirst({
      where: { gymId, status: { in: ["TRIALING", "ACTIVE", "PAST_DUE"] }, endsAt: { gt: now } },
      orderBy: { endsAt: "desc" },
      include: { plan: { include: { modules: { include: { module: true } } } } },
    });
    const modules = new Set<ModuleKey>(
      (subscription?.plan.modules ?? []).map((pm) => pm.module.key as ModuleKey)
    );
    const planLimits = (subscription?.plan.limits ?? {}) as TenantContext["planLimits"];

    return { gymId, userId, roles, permissions, branchIds, gymStatus: gym.status, modules, planLimits, meta };
  });
}

export function hasPermission(ctx: TenantContext, permission: Permission): boolean {
  return ctx.permissions.has(permission);
}

export function requirePermission(ctx: TenantContext, permission: Permission): void {
  if (!hasPermission(ctx, permission)) throw forbidden();
}

export function requireModule(ctx: TenantContext, module: ModuleKey): void {
  if (!ctx.modules.has(module)) {
    throw new AppError("MODULE_NOT_IN_PLAN", "این امکان در اشتراک فعلی باشگاه شما فعال نیست.");
  }
}

/** Blocks writes for suspended or closed gyms (reads stay available so owners can export data). */
export function requireWritableGym(ctx: TenantContext): void {
  if (ctx.gymStatus === "SUSPENDED" || ctx.gymStatus === "CLOSED") {
    throw new AppError("GYM_SUSPENDED", "حساب این باشگاه تعلیق شده است. با پشتیبانی تماس بگیرید.");
  }
}

export function canAccessBranch(ctx: TenantContext, branchId: string): boolean {
  return ctx.branchIds === null || ctx.branchIds.includes(branchId);
}

export function primaryRole(ctx: TenantContext): GymRole {
  const order: GymRole[] = ["GYM_OWNER", "GYM_MANAGER", "BRANCH_MANAGER", "ACCOUNTANT", "RECEPTIONIST", "STORE_MANAGER", "COACH", "ATHLETE"];
  return order.find((r) => ctx.roles.includes(r)) ?? ctx.roles[0]!;
}
