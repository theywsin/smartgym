import type { Prisma, Tx } from "@smartgym/db";

export interface AuditEntry {
  gymId?: string | null;
  actorUserId?: string | null;
  actorRole?: string | null;
  action: string; // e.g. "staff.invite"
  entityType: string;
  entityId?: string | null;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
}

/** Writes an audit row in the caller's transaction, so it commits or rolls back with the change. */
export async function writeAudit(tx: Tx, entry: AuditEntry): Promise<void> {
  await tx.auditLog.create({
    data: {
      gymId: entry.gymId ?? null,
      actorUserId: entry.actorUserId ?? null,
      actorRole: entry.actorRole ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      before: entry.before,
      after: entry.after,
      ip: entry.ip ?? null,
      userAgent: entry.userAgent?.slice(0, 400) ?? null,
    },
  });
}
