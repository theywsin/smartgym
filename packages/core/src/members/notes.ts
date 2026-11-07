import { withTenant } from "@smartgym/db";
import { type CoreDeps } from "../deps";
import { type TenantContext, requirePermission, requireWritableGym } from "../rbac/access";
import { findAccessibleMember } from "./index";

/** Notes are append-only (the runtime DB role has no UPDATE/DELETE on member_note). */
export async function listMemberNotes(deps: CoreDeps, ctx: TenantContext, memberId: string) {
  requirePermission(ctx, "members.read");
  return withTenant(deps.db, ctx, async (tx) => {
    await findAccessibleMember(tx, ctx, memberId);
    const notes = await tx.memberNote.findMany({
      where: { gymId: ctx.gymId, memberId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const authors = await tx.userProfile.findMany({
      where: { userId: { in: [...new Set(notes.map((n) => n.authorUserId))] } },
      select: { userId: true, firstName: true, lastName: true },
    });
    const name = new Map(authors.map((a) => [a.userId, [a.firstName, a.lastName].filter(Boolean).join(" ") || null]));
    return notes.map((n) => ({ id: n.id, body: n.body, createdAt: n.createdAt, authorName: name.get(n.authorUserId) ?? null }));
  });
}

export async function addMemberNote(deps: CoreDeps, ctx: TenantContext, memberId: string, body: string) {
  requirePermission(ctx, "members.update");
  requireWritableGym(ctx);
  return withTenant(deps.db, ctx, async (tx) => {
    await findAccessibleMember(tx, ctx, memberId);
    const n = await tx.memberNote.create({ data: { gymId: ctx.gymId, memberId, authorUserId: ctx.userId, body } });
    return { id: n.id, body: n.body, createdAt: n.createdAt };
  });
}
