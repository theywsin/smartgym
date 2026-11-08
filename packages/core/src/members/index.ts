import { withTenant, type Tx } from "@smartgym/db";
import { normalizePersianText, toLatinDigits } from "@smartgym/shared";
import type { ListMembersInput, MemberInput, UpdateMemberInput } from "@smartgym/validation";
import { AppError, notFound } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { writeAudit } from "../audit";
import { type TenantContext, requirePermission, requireWritableGym, primaryRole, canAccessBranch } from "../rbac/access";
import { membershipSummary, runningWhere, SUMMARY_SUBS_INCLUDE } from "../memberships/state";
import { currentCoaches } from "./coach-lookup";

const DAY = 86_400_000;

/** Branch-scoped staff see members of their branches plus members with no home branch. */
export function memberScope(ctx: TenantContext) {
  return ctx.branchIds ? { OR: [{ homeBranchId: null }, { homeBranchId: { in: [...ctx.branchIds] } }] } : {};
}

export async function findAccessibleMember(tx: Tx, ctx: TenantContext, memberId: string) {
  const m = await tx.member.findFirst({ where: { id: memberId, gymId: ctx.gymId, ...memberScope(ctx) } });
  if (!m) throw notFound("عضو");
  return m;
}

function searchWhere(q: string | undefined) {
  if (!q) return {};
  const latin = normalizePersianText(toLatinDigits(q)).trim();
  if (/^\d+$/.test(latin)) {
    const or: object[] = [{ phone: { contains: latin.replace(/^0/, "") } }];
    if (latin.length <= 9) or.push({ code: Number(latin) });
    return { OR: or };
  }
  const tokens = latin.split(/\s+/).filter(Boolean).slice(0, 4);
  return {
    AND: tokens.map((t) => ({
      OR: [{ firstName: { contains: t, mode: "insensitive" as const } }, { lastName: { contains: t, mode: "insensitive" as const } }],
    })),
  };
}

/** Prisma filters for each membership tab. Must agree with membershipSummary(). */
function membershipFilters(now: Date) {
  const running = runningWhere(now);
  const suspended = { status: "SUSPENDED" as const, endsAt: { gt: now } };
  return {
    active: { subscriptions: { some: running } },
    expiring: { subscriptions: { some: { ...running, endsAt: { gt: now, lte: new Date(now.getTime() + 7 * DAY) } }, none: { status: "ACTIVE" as const, endsAt: { gt: new Date(now.getTime() + 7 * DAY) } } } },
    suspended: { subscriptions: { some: suspended, none: running } },
    expired: { subscriptions: { some: {}, none: { OR: [{ status: "ACTIVE" as const, endsAt: { gt: now } }, suspended] } } },
    none: { subscriptions: { none: {} } },
  };
}

export async function listMembers(deps: CoreDeps, ctx: TenantContext, input: ListMembersInput) {
  requirePermission(ctx, "members.read");
  if (input.branchId && !canAccessBranch(ctx, input.branchId)) throw notFound("شعبه");
  const now = nowOf(deps);
  const running = runningWhere(now);
  const filters = membershipFilters(now);
  const membershipFilter = input.membership ? filters[input.membership] : {};
  const where = {
    gymId: ctx.gymId,
    status: input.status,
    ...(input.branchId ? { homeBranchId: input.branchId } : {}),
    ...(input.coachUserId ? { coaches: { some: { coachUserId: input.coachUserId, endedAt: null } } } : {}),
    AND: [memberScope(ctx), searchWhere(input.q), membershipFilter],
  };
  return withTenant(deps.db, ctx, async (tx) => {
    const base = { gymId: ctx.gymId, status: input.status, ...(input.branchId ? { homeBranchId: input.branchId } : {}), AND: [memberScope(ctx), searchWhere(input.q)] };
    const [total, rows, ...tabCounts] = await Promise.all([
      tx.member.count({ where }),
      tx.member.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: { subscriptions: SUMMARY_SUBS_INCLUDE },
      }),
      tx.member.count({ where: base }),
      ...(["active", "expiring", "expired", "suspended"] as const).map((k) => tx.member.count({ where: { ...base, AND: [...base.AND, filters[k]] } })),
    ]);
    const [all, active, expiring, expired, suspended] = tabCounts as [number, number, number, number, number];
    const coach = await currentCoaches(tx, ctx, rows.map((r) => r.id));
    return {
      items: rows.map(({ subscriptions, ...m }) => ({
        ...pickMember(m),
        membership: membershipSummary(subscriptions, now),
        coach: coach.get(m.id) ?? null,
      })),
      total,
      page: input.page,
      pageSize: input.pageSize,
      counts: { all, active, expiring, expired, suspended },
    };
  });
}

function pickMember(m: {
  id: string; code: number; firstName: string; lastName: string; phone: string | null; gender: string | null;
  birthDate: Date | null; nationalCode: string | null; homeBranchId: string | null; status: string;
  emergencyContact: unknown; notes: string | null; createdAt: Date; archivedAt: Date | null; userId: string | null;
}) {
  return {
    id: m.id,
    code: m.code,
    firstName: m.firstName,
    lastName: m.lastName,
    phone: m.phone,
    gender: m.gender,
    birthDate: m.birthDate ? m.birthDate.toISOString().slice(0, 10) : null,
    nationalCode: m.nationalCode,
    homeBranchId: m.homeBranchId,
    status: m.status,
    emergencyContact: m.emergencyContact as { name?: string; phone?: string } | null,
    notes: m.notes,
    hasApp: m.userId !== null,
    createdAt: m.createdAt,
    archivedAt: m.archivedAt,
  };
}

export async function getMember(deps: CoreDeps, ctx: TenantContext, memberId: string) {
  requirePermission(ctx, "members.read");
  const now = nowOf(deps);
  return withTenant(deps.db, ctx, async (tx) => {
    const m = await findAccessibleMember(tx, ctx, memberId);
    const [subs, attendance] = await Promise.all([
      tx.memberSubscription.findMany({
        where: { gymId: ctx.gymId, memberId },
        orderBy: { startsAt: "desc" },
        take: 50,
        include: { plan: { select: { name: true } }, payments: { select: { amountRial: true, refundedAmountRial: true } } },
      }),
      tx.attendance.findMany({
        where: { gymId: ctx.gymId, memberId },
        orderBy: { checkedInAt: "desc" },
        take: 20,
        select: { id: true, branchId: true, checkedInAt: true, checkedOutAt: true, method: true },
      }),
    ]);
    const coach = await currentCoaches(tx, ctx, [m.id]);
    return {
      ...pickMember(m),
      coach: coach.get(m.id) ?? null,
      membership: membershipSummary(subs, now),
      subscriptions: subs.map((s) => ({
        id: s.id,
        planId: s.planId,
        planName: s.plan.name,
        branchId: s.branchId,
        status: s.status,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        entryLimit: s.entryLimit,
        entriesUsed: s.entriesUsed,
        priceAmountRial: s.priceAmountRial,
        discountAmountRial: s.discountAmountRial,
        paidAmountRial: s.payments.reduce((a, p) => a + p.amountRial - p.refundedAmountRial, 0n),
        dueAmountRial: s.priceAmountRial - s.discountAmountRial - s.payments.reduce((a, p) => a + p.amountRial - p.refundedAmountRial, 0n),
        suspendedAt: s.suspendedAt,
        cancelledAt: s.cancelledAt,
        note: s.note,
        createdAt: s.createdAt,
      })),
      recentAttendance: attendance,
    };
  });
}

async function assertBranch(tx: Tx, ctx: TenantContext, branchId: string | undefined) {
  if (!branchId) return;
  if (!canAccessBranch(ctx, branchId)) throw new AppError("FORBIDDEN", "به این شعبه دسترسی ندارید.");
  const b = await tx.branch.findFirst({ where: { id: branchId, gymId: ctx.gymId, deletedAt: null }, select: { id: true } });
  if (!b) {
    const msg = "شعبه انتخاب‌شده معتبر نیست.";
    throw new AppError("VALIDATION_FAILED", msg, { fields: { homeBranchId: [msg] } });
  }
}

async function assertPhoneFree(tx: Tx, ctx: TenantContext, phone: string | undefined, exceptId?: string) {
  if (!phone) return;
  const dup = await tx.member.findFirst({
    where: { gymId: ctx.gymId, phone, status: "ACTIVE", ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { code: true },
  });
  if (dup) {
    const msg = `این شماره برای عضو دیگری (شماره عضویت ${dup.code}) ثبت شده است.`;
    throw new AppError("CONFLICT", msg, { fields: { phone: [msg] } });
  }
}

function emergency(input: Pick<MemberInput, "emergencyContactName" | "emergencyContactPhone">) {
  if (!input.emergencyContactName && !input.emergencyContactPhone) return undefined;
  return { name: input.emergencyContactName ?? null, phone: input.emergencyContactPhone ?? null };
}

function isUniqueViolation(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

export async function createMember(deps: CoreDeps, ctx: TenantContext, input: MemberInput) {
  requirePermission(ctx, "members.create");
  requireWritableGym(ctx);
  // A branch-scoped receptionist registers members into their own branch by default.
  const homeBranchId = input.homeBranchId ?? (ctx.branchIds?.length === 1 ? ctx.branchIds[0] : undefined);
  if (ctx.branchIds && !homeBranchId) {
    const msg = "شعبه عضو را انتخاب کنید.";
    throw new AppError("VALIDATION_FAILED", msg, { fields: { homeBranchId: [msg] } });
  }
  // The member number is max+1 per gym; retry if two receptionists register at the same moment.
  for (let attempt = 0; ; attempt++) {
    try {
      return await withTenant(deps.db, ctx, async (tx) => {
        await assertBranch(tx, ctx, homeBranchId);
        await assertPhoneFree(tx, ctx, input.phone);
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`member-code:${ctx.gymId}`}))`;
        const last = await tx.member.findFirst({ where: { gymId: ctx.gymId }, orderBy: { code: "desc" }, select: { code: true } });
        const user = input.phone ? await tx.user.findUnique({ where: { phone: input.phone }, select: { id: true } }) : null;
        const m = await tx.member.create({
          data: {
            gymId: ctx.gymId,
            code: (last?.code ?? 1000) + 1,
            userId: user?.id ?? null,
            homeBranchId: homeBranchId ?? null,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone ?? null,
            gender: input.gender ?? null,
            birthDate: input.birthDate ? new Date(`${input.birthDate}T00:00:00Z`) : null,
            nationalCode: input.nationalCode ?? null,
            emergencyContact: emergency(input),
            notes: input.notes ?? null,
            createdByUserId: ctx.userId,
          },
        });
        await writeAudit(tx, {
          gymId: ctx.gymId,
          actorUserId: ctx.userId,
          actorRole: primaryRole(ctx),
          action: "member.create",
          entityType: "member",
          entityId: m.id,
          after: { code: m.code, name: `${m.firstName} ${m.lastName}`, homeBranchId: m.homeBranchId },
          ip: ctx.meta?.ip,
          userAgent: ctx.meta?.userAgent,
        });
        return pickMember(m);
      });
    } catch (e) {
      if (isUniqueViolation(e) && attempt < 3) continue;
      if (isUniqueViolation(e)) throw new AppError("CONFLICT", "ثبت هم‌زمان؛ دوباره تلاش کنید.");
      throw e;
    }
  }
}

export async function updateMember(deps: CoreDeps, ctx: TenantContext, memberId: string, input: UpdateMemberInput) {
  requirePermission(ctx, "members.update");
  requireWritableGym(ctx);
  return withTenant(deps.db, ctx, async (tx) => {
    const before = await findAccessibleMember(tx, ctx, memberId);
    if ("homeBranchId" in input) await assertBranch(tx, ctx, input.homeBranchId);
    if (input.phone && input.phone !== before.phone && before.status === "ACTIVE") await assertPhoneFree(tx, ctx, input.phone, memberId);
    const data: Record<string, unknown> = {};
    for (const k of ["firstName", "lastName", "gender", "nationalCode", "notes", "homeBranchId"] as const) {
      if (k in input) data[k] = input[k] ?? null;
    }
    if ("phone" in input) {
      data.phone = input.phone ?? null;
      const user = input.phone ? await tx.user.findUnique({ where: { phone: input.phone }, select: { id: true } }) : null;
      data.userId = user?.id ?? null;
    }
    if ("birthDate" in input) data.birthDate = input.birthDate ? new Date(`${input.birthDate}T00:00:00Z`) : null;
    if ("emergencyContactName" in input || "emergencyContactPhone" in input) {
      const prev = (before.emergencyContact ?? {}) as { name?: string | null; phone?: string | null };
      const next = {
        name: "emergencyContactName" in input ? input.emergencyContactName ?? null : prev.name ?? null,
        phone: "emergencyContactPhone" in input ? input.emergencyContactPhone ?? null : prev.phone ?? null,
      };
      data.emergencyContact = next.name || next.phone ? next : null;
    }
    const m = await tx.member.update({ where: { id: memberId }, data });
    await writeAudit(tx, {
      gymId: ctx.gymId,
      actorUserId: ctx.userId,
      actorRole: primaryRole(ctx),
      action: "member.update",
      entityType: "member",
      entityId: m.id,
      before: Object.fromEntries(Object.keys(data).map((k) => [k, (before as Record<string, unknown>)[k] ?? null])),
      after: Object.fromEntries(Object.keys(data).map((k) => [k, (m as Record<string, unknown>)[k] ?? null])),
      ip: ctx.meta?.ip,
      userAgent: ctx.meta?.userAgent,
    });
    return pickMember(m);
  });
}

export async function setMemberArchived(deps: CoreDeps, ctx: TenantContext, memberId: string, archived: boolean) {
  requirePermission(ctx, "members.delete");
  requireWritableGym(ctx);
  return withTenant(deps.db, ctx, async (tx) => {
    const before = await findAccessibleMember(tx, ctx, memberId);
    if ((before.status === "ARCHIVED") === archived) return pickMember(before);
    if (!archived) await assertPhoneFree(tx, ctx, before.phone ?? undefined, memberId);
    const m = await tx.member.update({
      where: { id: memberId },
      data: archived ? { status: "ARCHIVED", archivedAt: nowOf(deps) } : { status: "ACTIVE", archivedAt: null },
    });
    await writeAudit(tx, {
      gymId: ctx.gymId,
      actorUserId: ctx.userId,
      actorRole: primaryRole(ctx),
      action: archived ? "member.archive" : "member.restore",
      entityType: "member",
      entityId: m.id,
      ip: ctx.meta?.ip,
      userAgent: ctx.meta?.userAgent,
    });
    return pickMember(m);
  });
}
