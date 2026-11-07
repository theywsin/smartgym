import type { Tx } from "@smartgym/db";
import type { TenantContext } from "../rbac/access";

/** Current coach for each member id (display names). */
export async function currentCoaches(tx: Tx, ctx: TenantContext, memberIds: string[]) {
  if (memberIds.length === 0) return new Map<string, { userId: string; name: string | null }>();
  const rows = await tx.coachAthlete.findMany({ where: { gymId: ctx.gymId, memberId: { in: memberIds }, endedAt: null } });
  const profiles = await tx.userProfile.findMany({
    where: { userId: { in: [...new Set(rows.map((r) => r.coachUserId))] } },
    select: { userId: true, firstName: true, lastName: true },
  });
  const name = new Map(profiles.map((p) => [p.userId, [p.firstName, p.lastName].filter(Boolean).join(" ") || null]));
  return new Map(rows.map((r) => [r.memberId, { userId: r.coachUserId, name: name.get(r.coachUserId) ?? null }]));
}
