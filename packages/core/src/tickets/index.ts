import { withSystem, withTenant, type Prisma, type Tx } from "@smartgym/db";
import { TICKET_CATEGORIES, type TicketCreateInput, type TicketListInput } from "@smartgym/validation";
import { AppError, notFound } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { type TenantContext, requirePermission } from "../rbac/access";
import { getAthleteDashboardMember, type AthleteUser } from "../athlete";
import type { AdminActor } from "../admin";

/**
 * Support tickets, two kinds:
 *   PLATFORM  a gym's owner/manager ↔ platform support (super admin)
 *   GYM       a member (athlete app) ↔ their gym's staff with tickets.manage
 * Messages are append-only; only status/timestamps on the ticket change.
 * The side that replies decides the status: support → ANSWERED, requester → OPEN (reopens a closed ticket).
 */

type Scope = "PLATFORM" | "GYM";
const LIST_TAKE = 100;

function checkCategory(scope: Scope, category: string) {
  if (!(TICKET_CATEGORIES[scope] as readonly string[]).includes(category)) {
    throw new AppError("VALIDATION_FAILED", "دسته‌بندی نامعتبر است.", { fields: { category: ["دسته‌بندی نامعتبر"] } });
  }
}

const listSelect = {
  id: true, scope: true, subject: true, category: true, status: true, lastMessageAt: true, createdAt: true, memberId: true,
  gym: { select: { name: true } },
} satisfies Prisma.TicketSelect;

async function namesFor(tx: Tx, userIds: string[]) {
  const profiles = await tx.userProfile.findMany({ where: { userId: { in: userIds } }, select: { userId: true, firstName: true, lastName: true } });
  return new Map(profiles.map((p) => [p.userId, [p.firstName, p.lastName].filter(Boolean).join(" ") || null]));
}

async function loadThread(tx: Tx, where: Prisma.TicketWhereInput) {
  const t = await tx.ticket.findFirst({ where, select: { ...listSelect, gymId: true, openedByUserId: true, messages: { orderBy: { createdAt: "asc" } } } });
  if (!t) throw notFound("تیکت");
  const names = await namesFor(tx, [...new Set(t.messages.map((m) => m.authorUserId))]);
  const member = t.memberId ? await tx.member.findUnique({ where: { id: t.memberId }, select: { firstName: true, lastName: true, code: true } }) : null;
  return {
    id: t.id, scope: t.scope, subject: t.subject, category: t.category, status: t.status, createdAt: t.createdAt, lastMessageAt: t.lastMessageAt,
    gymName: t.gym.name, member,
    messages: t.messages.map((m) => ({ id: m.id, side: m.side, body: m.body, createdAt: m.createdAt, authorName: names.get(m.authorUserId) ?? null })),
  };
}

async function append(tx: Tx, deps: CoreDeps, t: { id: string; gymId: string; status: string }, authorUserId: string, side: "REQUESTER" | "SUPPORT", body: string) {
  if (side === "SUPPORT" && t.status === "CLOSED") throw new AppError("BUSINESS_RULE", "این تیکت بسته شده است.");
  const now = nowOf(deps);
  await tx.ticketMessage.create({ data: { ticketId: t.id, gymId: t.gymId, authorUserId, side, body, createdAt: now } });
  await tx.ticket.update({ where: { id: t.id }, data: { status: side === "SUPPORT" ? "ANSWERED" : "OPEN", lastMessageAt: now, closedAt: null } });
}

async function open(tx: Tx, deps: CoreDeps, data: { gymId: string; scope: Scope; memberId: string | null; userId: string }, input: TicketCreateInput) {
  checkCategory(data.scope, input.category);
  const now = nowOf(deps);
  const t = await tx.ticket.create({
    data: { gymId: data.gymId, scope: data.scope, memberId: data.memberId, openedByUserId: data.userId, subject: input.subject, category: input.category, lastMessageAt: now, createdAt: now },
  });
  await tx.ticketMessage.create({ data: { ticketId: t.id, gymId: data.gymId, authorUserId: data.userId, side: "REQUESTER", body: input.body, createdAt: now } });
  return { id: t.id };
}

// ---------- Gym staff ----------

export async function staffListTickets(deps: CoreDeps, ctx: TenantContext, input: TicketListInput) {
  requirePermission(ctx, "tickets.manage");
  return withTenant(deps.db, ctx, async (tx) => {
    const rows = await tx.ticket.findMany({
      where: { gymId: ctx.gymId, scope: input.scope, ...(input.status ? { status: input.status } : {}) },
      orderBy: [{ lastMessageAt: "desc" }], take: LIST_TAKE, select: listSelect,
    });
    const members = await tx.member.findMany({ where: { id: { in: rows.map((r) => r.memberId).filter((x): x is string => !!x) } }, select: { id: true, firstName: true, lastName: true } });
    const m = new Map(members.map((x) => [x.id, `${x.firstName} ${x.lastName}`]));
    return rows.map((r) => ({ ...r, gym: undefined, memberName: r.memberId ? m.get(r.memberId) ?? null : null }));
  });
}

export async function staffOpenPlatformTicket(deps: CoreDeps, ctx: TenantContext, input: TicketCreateInput) {
  requirePermission(ctx, "tickets.manage");
  return withTenant(deps.db, ctx, (tx) => open(tx, deps, { gymId: ctx.gymId, scope: "PLATFORM", memberId: null, userId: ctx.userId }, input));
}

export async function staffGetTicket(deps: CoreDeps, ctx: TenantContext, id: string) {
  requirePermission(ctx, "tickets.manage");
  return withTenant(deps.db, ctx, (tx) => loadThread(tx, { id, gymId: ctx.gymId }));
}

/** Staff answer member tickets (SUPPORT) and write to platform support as the requester. */
export async function staffReplyTicket(deps: CoreDeps, ctx: TenantContext, id: string, body: string) {
  requirePermission(ctx, "tickets.manage");
  return withTenant(deps.db, ctx, async (tx) => {
    const t = await tx.ticket.findFirst({ where: { id, gymId: ctx.gymId }, select: { id: true, gymId: true, status: true, scope: true } });
    if (!t) throw notFound("تیکت");
    await append(tx, deps, t, ctx.userId, t.scope === "GYM" ? "SUPPORT" : "REQUESTER", body);
    return loadThread(tx, { id });
  });
}

export async function staffCloseTicket(deps: CoreDeps, ctx: TenantContext, id: string) {
  requirePermission(ctx, "tickets.manage");
  return withTenant(deps.db, ctx, async (tx) => {
    const t = await tx.ticket.findFirst({ where: { id, gymId: ctx.gymId }, select: { id: true } });
    if (!t) throw notFound("تیکت");
    await tx.ticket.update({ where: { id }, data: { status: "CLOSED", closedAt: nowOf(deps) } });
    return { id, status: "CLOSED" as const };
  });
}

// ---------- Athlete (member) ----------
// Runs with RLS bypass (the athlete has no staff role); every query is pinned to the phone-matched member.

export async function athleteListTickets(deps: CoreDeps, user: AthleteUser, memberId: string) {
  const m = await getAthleteDashboardMember(deps, user, memberId);
  return withSystem(deps.db, (tx) =>
    tx.ticket.findMany({ where: { gymId: m.gymId, scope: "GYM", memberId: m.id }, orderBy: { lastMessageAt: "desc" }, take: LIST_TAKE, select: listSelect })
  );
}

export async function athleteOpenTicket(deps: CoreDeps, user: AthleteUser, memberId: string, input: TicketCreateInput) {
  const m = await getAthleteDashboardMember(deps, user, memberId);
  return withSystem(deps.db, async (tx) => {
    const openCount = await tx.ticket.count({ where: { memberId: m.id, status: { not: "CLOSED" } } });
    if (openCount >= 5) throw new AppError("BUSINESS_RULE", "۵ تیکت باز دارید. لطفاً منتظر پاسخ بمانید.");
    return open(tx, deps, { gymId: m.gymId, scope: "GYM", memberId: m.id, userId: user.id }, input);
  });
}

async function athleteTicket(tx: Tx, deps: CoreDeps, user: AthleteUser, memberId: string, id: string) {
  const m = await getAthleteDashboardMember(deps, user, memberId);
  const t = await tx.ticket.findFirst({ where: { id, gymId: m.gymId, scope: "GYM", memberId: m.id }, select: { id: true, gymId: true, status: true } });
  if (!t) throw notFound("تیکت");
  return t;
}

export async function athleteGetTicket(deps: CoreDeps, user: AthleteUser, memberId: string, id: string) {
  return withSystem(deps.db, async (tx) => {
    await athleteTicket(tx, deps, user, memberId, id);
    return loadThread(tx, { id });
  });
}

export async function athleteReplyTicket(deps: CoreDeps, user: AthleteUser, memberId: string, id: string, body: string) {
  return withSystem(deps.db, async (tx) => {
    const t = await athleteTicket(tx, deps, user, memberId, id);
    await append(tx, deps, t, user.id, "REQUESTER", body);
    return loadThread(tx, { id });
  });
}

// ---------- Platform support (super admin) ----------

async function requireSuperAdmin(tx: Tx, actor: AdminActor) {
  const u = await tx.user.findUnique({ where: { id: actor.userId }, select: { isSuperAdmin: true, status: true } });
  if (!u?.isSuperAdmin || u.status !== "ACTIVE") throw new AppError("FORBIDDEN", "این بخش فقط برای مدیر پلتفرم است.");
}

export async function adminListTickets(deps: CoreDeps, actor: AdminActor, status?: "OPEN" | "ANSWERED" | "CLOSED") {
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    return tx.ticket.findMany({ where: { scope: "PLATFORM", ...(status ? { status } : {}) }, orderBy: { lastMessageAt: "desc" }, take: LIST_TAKE, select: listSelect });
  });
}

export async function adminGetTicket(deps: CoreDeps, actor: AdminActor, id: string) {
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    return loadThread(tx, { id, scope: "PLATFORM" });
  });
}

export async function adminReplyTicket(deps: CoreDeps, actor: AdminActor, id: string, body: string) {
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const t = await tx.ticket.findFirst({ where: { id, scope: "PLATFORM" }, select: { id: true, gymId: true, status: true } });
    if (!t) throw notFound("تیکت");
    await append(tx, deps, t, actor.userId, "SUPPORT", body);
    return loadThread(tx, { id });
  });
}

export async function adminCloseTicket(deps: CoreDeps, actor: AdminActor, id: string) {
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const t = await tx.ticket.findFirst({ where: { id, scope: "PLATFORM" }, select: { id: true } });
    if (!t) throw notFound("تیکت");
    await tx.ticket.update({ where: { id }, data: { status: "CLOSED", closedAt: nowOf(deps) } });
    return { id, status: "CLOSED" as const };
  });
}
