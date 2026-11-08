import { listMyGyms, loadTenantContext } from "@smartgym/core";
import { userRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = userRoute(async ({ auth }) => {
  const deps = coreDeps();
  const gyms = await listMyGyms(deps, auth.user.id);
  const profile = await deps.db.userProfile.findUnique({ where: { userId: auth.user.id } });
  let access = null;
  if (auth.session.activeGymId) {
    const ctx = await loadTenantContext(deps.db, auth.user.id, auth.session.activeGymId);
    access = {
      gymId: ctx.gymId,
      roles: ctx.roles,
      permissions: [...ctx.permissions],
      branchIds: ctx.branchIds,
      modules: [...ctx.modules],
      gymStatus: ctx.gymStatus,
    };
  }
  return {
    user: {
      id: auth.user.id,
      phone: auth.user.phone,
      firstName: profile?.firstName ?? null,
      lastName: profile?.lastName ?? null,
      hasPassword: !!auth.user.passwordHash,
      isSuperAdmin: auth.user.isSuperAdmin,
      isAdminSession: auth.session.kind === "ADMIN" && auth.user.isSuperAdmin,
    },
    gyms,
    activeGymId: auth.session.activeGymId,
    access,
  };
});
