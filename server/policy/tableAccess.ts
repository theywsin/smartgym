/**
 * Phase 0 access policy for the prototype's generic /api/db/:table endpoints.
 *
 * This is an interim hardening layer. SmartGym 2.0 replaces the generic CRUD API
 * with per-domain endpoints (see docs/ARCHITECTURE.md). Until then, every read and
 * write through /api/db is checked here on the server.
 */
import { TokenPayload } from "../utils/auth";

export const ALL_TABLES = [
  "tenants",
  "members",
  "coaches",
  "membership_requests",
  "workout_programs",
  "nutrition_plans",
  "store_products",
  "bookings",
  "tickets",
  "attendance_records",
  "exercises_database",
  "coach_sales",
  "blog_posts",
  "smart_support_chats",
  "platform_settings",
] as const;

export type TableName = (typeof ALL_TABLES)[number];

/** Readable without logging in. */
const PUBLIC_READ: ReadonlySet<string> = new Set(["blog_posts", "exercises_database"]);

/** Only the super admin may read these through /api/db. */
const ADMIN_ONLY_READ: ReadonlySet<string> = new Set(["smart_support_chats", "platform_settings"]);

/** Tables each non-admin role may write. */
const WRITE_TABLES: Record<string, ReadonlySet<string>> = {
  GYM_OWNER: new Set([
    "tenants",
    "members",
    "coaches",
    "membership_requests",
    "workout_programs",
    "nutrition_plans",
    "store_products",
    "bookings",
    "tickets",
    "attendance_records",
    "coach_sales",
  ]),
  COACH: new Set(["members", "workout_programs", "nutrition_plans", "attendance_records", "coach_sales", "tickets"]),
  MEMBER: new Set(["members", "attendance_records", "bookings", "tickets"]),
};

/** Fields never returned to clients. */
const SECRET_FIELDS = ["password"];

/** Fields a gym owner may not change on its own tenant row (plan/billing state). */
const TENANT_PROTECTED_FIELDS = ["status", "planName", "planId", "expiresAt", "monthlyRevenue", "username"];

export function isKnownTable(table: string): table is TableName {
  return (ALL_TABLES as readonly string[]).includes(table);
}

export function isPublicReadTable(table: string): boolean {
  return PUBLIC_READ.has(table);
}

/** Column that holds the gym id for a table, or null when the table is not gym-scoped. */
export function tenantColumn(table: string): "clubId" | "tenantId" | "id" | null {
  switch (table) {
    case "tenants":
      return "id";
    case "membership_requests":
      return "tenantId";
    case "exercises_database":
    case "platform_settings":
      return null;
    default:
      return "clubId";
  }
}

export function stripSecrets<T extends Record<string, any>>(row: T): T {
  const copy: Record<string, any> = { ...row };
  for (const f of SECRET_FIELDS) delete copy[f];
  return copy as T;
}

/** A coach whose clubId is "all" is a legacy platform-wide coach. */
function isGlobalCoach(user: TokenPayload): boolean {
  return user.role === "COACH" && user.clubId === "all";
}

function rowClub(table: string, row: Record<string, any>): string | undefined {
  const col = tenantColumn(table);
  return col ? row[col] : undefined;
}

export function canReadTable(table: string, user?: TokenPayload): boolean {
  if (isPublicReadTable(table)) return true;
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  return !ADMIN_ONLY_READ.has(table);
}

/** Filters rows to what the user may see. Assumes canReadTable() passed. */
export function filterReadableRows(table: string, rows: any[], user?: TokenPayload): any[] {
  const cleaned = rows.map(stripSecrets);
  if (isPublicReadTable(table)) {
    // Gym-specific blog posts stay visible; they are public marketing content.
    return cleaned;
  }
  if (!user) return [];
  if (user.role === "SUPER_ADMIN") return cleaned;

  return cleaned.filter((row) => {
    // Athletes only see their own member record.
    if (table === "members" && user.role === "MEMBER") return row.id === user.userId;
    // Coaches see their own coach row plus coaches of their gym.
    if (table === "coaches") {
      if (row.id === user.userId && user.role === "COACH") return true;
      return row.clubId === "all" || (!!user.clubId && row.clubId === user.clubId);
    }
    // Legacy platform-wide coaches see every gym's training data, but no tenant records.
    if (isGlobalCoach(user)) return table !== "tenants";
    const club = rowClub(table, row);
    return !!user.clubId && club === user.clubId;
  });
}

export interface WriteDecision {
  allowed: boolean;
  reason?: string;
  item?: Record<string, any>;
}

/**
 * Decides whether `user` may write `item` to `table`, given the existing row (if any).
 * Returns the item to persist (possibly with protected fields removed and the gym id set).
 */
export function decideWrite(
  table: string,
  item: Record<string, any>,
  existing: Record<string, any> | undefined,
  user: TokenPayload
): WriteDecision {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return { allowed: false, reason: "invalid_item" };
  }
  if (typeof item.id !== "string" && table !== "platform_settings") {
    return { allowed: false, reason: "missing_id" };
  }

  if (user.role === "SUPER_ADMIN") return { allowed: true, item: { ...item } };

  const allowedTables = WRITE_TABLES[user.role];
  if (!allowedTables || !allowedTables.has(table)) return { allowed: false, reason: "table_forbidden" };

  const next: Record<string, any> = { ...item };
  const col = tenantColumn(table);

  // Role-specific row ownership.
  if (table === "tenants") {
    if (user.role !== "GYM_OWNER" || item.id !== user.clubId || !existing) {
      return { allowed: false, reason: "tenant_forbidden" };
    }
    for (const f of TENANT_PROTECTED_FIELDS) delete next[f];
    delete next.password; // password changes go through a dedicated flow later
    return { allowed: true, item: next };
  }

  if (table === "members" && user.role === "MEMBER") {
    if (item.id !== user.userId || !existing) return { allowed: false, reason: "member_forbidden" };
    // Athletes cannot move themselves between gyms or change their username.
    delete next.clubId;
    delete next.username;
    delete next.remainingSessions;
    return { allowed: true, item: next };
  }

  if (table === "members" && user.role === "COACH") {
    // Coaches may update athletes' training data but not create accounts or change credentials.
    if (!existing) return { allowed: false, reason: "coach_cannot_create_member" };
    delete next.password;
    delete next.username;
  }

  if (!col) return { allowed: false, reason: "table_forbidden" };

  if (isGlobalCoach(user)) {
    // Legacy platform-wide coaches keep working on existing rows only, without moving them between gyms.
    if (!existing) {
      if (!next[col]) return { allowed: false, reason: "club_required" };
      return { allowed: true, item: next };
    }
    next[col] = existing[col];
    return { allowed: true, item: next };
  }

  if (!user.clubId) return { allowed: false, reason: "no_club" };

  if (existing) {
    if (existing[col] !== user.clubId) return { allowed: false, reason: "other_club" };
    next[col] = user.clubId;
    return { allowed: true, item: next };
  }

  // New row: refuse rows explicitly tagged for another gym (e.g. demo seed data).
  if (next[col] && next[col] !== user.clubId) return { allowed: false, reason: "other_club" };
  next[col] = user.clubId;
  return { allowed: true, item: next };
}

export function canDelete(table: string, existing: Record<string, any> | undefined, user: TokenPayload): boolean {
  if (user.role === "SUPER_ADMIN") return true;
  if (!existing) return false;
  if (table === "tenants") return false;
  const allowedTables = WRITE_TABLES[user.role];
  if (!allowedTables || !allowedTables.has(table)) return false;
  if (user.role === "MEMBER" && table === "members") return false;
  if (user.role === "COACH" && table === "members") return false;
  const col = tenantColumn(table);
  if (!col || !user.clubId || user.clubId === "all") return false;
  return existing[col] === user.clubId;
}
