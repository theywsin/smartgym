import { withTenant, type Tx } from "@smartgym/db";
import type { MembershipPlanInput, SellMembershipInput, UpdateMembershipPlanInput } from "@smartgym/validation";
import { AppError, notFound } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { writeAudit } from "../audit";
import { type TenantContext, requirePermission, requireWritableGym, primaryRole, canAccessBranch } from "../rbac/access";
import { findAccessibleMember } from "../members";
import { takePaymentTx } from "../finance";

export * from "./state";

const DAY = 86_400_000;

// ───────────── Plans ─────────────

export async function listMembershipPlans(deps: CoreDeps, ctx: TenantContext, opts: { includeInactive?: boolean } = {}) {
  requirePermission(ctx, "members.read");
  return withTenant(deps.db, ctx, (tx) =>
    tx.membershipPlan.findMany({
      where: { gymId: ctx.gymId, deletedAt: null, ...(opts.includeInactive ? {} : { isActive: true }) },
      orderBy: [{ isActive: "desc" }, { priceAmountRial: "asc" }],
      select: {
        id: true, name: true, description: true, durationDays: true, priceAmountRial: true,
        entryLimit: true, allowedBranchIds: true, isActive: true, createdAt: true,
      },
    })
  );
}

async function assertBranchIds(tx: Tx, ctx: TenantContext, ids: readonly string[]) {
  if (ids.length === 0) return;
  const found = await tx.branch.count({ where: { id: { in: [...ids] }, gymId: ctx.gymId, deletedAt: null } });
  if (found !== new Set(ids).size) {
    const msg = "شعبه انتخاب‌شده معتبر نیست.";
    throw new AppError("VALIDATION_FAILED", msg, { fields: { allowedBranchIds: [msg] } });
  }
}

export async function createMembershipPlan(deps: CoreDeps, ctx: TenantContext, input: MembershipPlanInput) {
  requirePermission(ctx, "plans.manage");
  requireWritableGym(ctx);
  return withTenant(deps.db, ctx, async (tx) => {
    await assertBranchIds(tx, ctx, input.allowedBranchIds);
    const plan = await tx.membershipPlan.create({
      data: {
        gymId: ctx.gymId,
        name: input.name,
        description: input.description ?? null,
        durationDays: input.durationDays,
        priceAmountRial: input.priceAmountRial,
        entryLimit: input.entryLimit ?? null,
        allowedBranchIds: [...new Set(input.allowedBranchIds)],
        isActive: input.isActive,
      },
    });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "membership_plan.create", entityType: "membership_plan", entityId: plan.id,
      after: { name: plan.name, durationDays: plan.durationDays, priceAmountRial: plan.priceAmountRial.toString() },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return plan;
  });
}

export async function updateMembershipPlan(deps: CoreDeps, ctx: TenantContext, planId: string, input: UpdateMembershipPlanInput) {
  requirePermission(ctx, "plans.manage");
  requireWritableGym(ctx);
  return withTenant(deps.db, ctx, async (tx) => {
    const before = await tx.membershipPlan.findFirst({ where: { id: planId, gymId: ctx.gymId, deletedAt: null } });
    if (!before) throw notFound("پلن");
    if (input.allowedBranchIds) await assertBranchIds(tx, ctx, input.allowedBranchIds);
    // Sold periods keep the terms they were sold with; edits apply to future sales only.
    const plan = await tx.membershipPlan.update({
      where: { id: planId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...("description" in input && { description: input.description ?? null }),
        ...(input.durationDays !== undefined && { durationDays: input.durationDays }),
        ...(input.priceAmountRial !== undefined && { priceAmountRial: input.priceAmountRial }),
        ...("entryLimit" in input && { entryLimit: input.entryLimit ?? null }),
        ...(input.allowedBranchIds !== undefined && { allowedBranchIds: [...new Set(input.allowedBranchIds)] }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "membership_plan.update", entityType: "membership_plan", entityId: plan.id,
      before: { name: before.name, priceAmountRial: before.priceAmountRial.toString(), isActive: before.isActive },
      after: { name: plan.name, priceAmountRial: plan.priceAmountRial.toString(), isActive: plan.isActive },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return plan;
  });
}

// ───────────── Member subscriptions ─────────────

export async function sellMembership(deps: CoreDeps, ctx: TenantContext, input: SellMembershipInput) {
  requirePermission(ctx, "memberships.manage");
  requireWritableGym(ctx);
  const now = nowOf(deps);
  const branchId = input.branchId ?? (ctx.branchIds?.length === 1 ? ctx.branchIds[0] : undefined);
  if (branchId && !canAccessBranch(ctx, branchId)) throw new AppError("FORBIDDEN", "به این شعبه دسترسی ندارید.");
  if (ctx.branchIds && !branchId) {
    const msg = "شعبه فروش را انتخاب کنید.";
    throw new AppError("VALIDATION_FAILED", msg, { fields: { branchId: [msg] } });
  }

  return withTenant(deps.db, ctx, async (tx) => {
    const member = await findAccessibleMember(tx, ctx, input.memberId);
    if (member.status !== "ACTIVE") throw new AppError("BUSINESS_RULE", "این عضو بایگانی شده است. ابتدا آن را بازگردانید.");
    // Serialise sales for one member so two renewals cannot start at the same moment.
    await tx.$queryRaw`SELECT id FROM "member" WHERE id = ${member.id}::uuid FOR UPDATE`;

    const plan = await tx.membershipPlan.findFirst({ where: { id: input.planId, gymId: ctx.gymId, deletedAt: null } });
    if (!plan || !plan.isActive) {
      const msg = "این پلن فعال نیست.";
      throw new AppError("VALIDATION_FAILED", msg, { fields: { planId: [msg] } });
    }
    if (branchId) {
      const b = await tx.branch.findFirst({ where: { id: branchId, gymId: ctx.gymId, deletedAt: null }, select: { id: true } });
      if (!b) throw new AppError("VALIDATION_FAILED", "شعبه انتخاب‌شده معتبر نیست.", { fields: { branchId: ["شعبه انتخاب‌شده معتبر نیست."] } });
      if (plan.allowedBranchIds.length > 0 && !plan.allowedBranchIds.includes(branchId)) {
        throw new AppError("BUSINESS_RULE", "این پلن در شعبه انتخاب‌شده فروخته نمی‌شود.");
      }
    }
    if (input.discountAmountRial > plan.priceAmountRial) {
      const msg = "تخفیف نمی‌تواند از مبلغ پلن بیشتر باشد.";
      throw new AppError("VALIDATION_FAILED", msg, { fields: { discountAmountRial: [msg] } });
    }

    // A renewal starts when the member's latest active period ends, so paid days are never lost.
    const latest = await tx.memberSubscription.findFirst({
      where: { gymId: ctx.gymId, memberId: member.id, status: "ACTIVE", endsAt: { gt: now } },
      orderBy: { endsAt: "desc" },
      select: { id: true, endsAt: true },
    });
    const startsAt = input.startsAt ? new Date(input.startsAt) : latest ? latest.endsAt : now;
    if (input.startsAt && startsAt.getTime() < now.getTime() - DAY) {
      const msg = "تاریخ شروع نمی‌تواند بیش از یک روز در گذشته باشد.";
      throw new AppError("VALIDATION_FAILED", msg, { fields: { startsAt: [msg] } });
    }
    const endsAt = new Date(startsAt.getTime() + plan.durationDays * DAY);

    const sub = await tx.memberSubscription.create({
      data: {
        gymId: ctx.gymId,
        memberId: member.id,
        planId: plan.id,
        branchId: branchId ?? null,
        status: "ACTIVE",
        startsAt,
        endsAt,
        entryLimit: plan.entryLimit,
        allowedBranchIds: plan.allowedBranchIds,
        priceAmountRial: plan.priceAmountRial,
        discountAmountRial: input.discountAmountRial,
        renewedFromId: !input.startsAt && latest ? latest.id : null,
        note: input.note ?? null,
        createdByUserId: ctx.userId,
      },
    });
    if (input.payment) {
      await takePaymentTx(tx, ctx, { subscriptionId: sub.id, memberId: member.id, branchId: branchId ?? null, input: input.payment, now });
    }
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: latest && !input.startsAt ? "membership.renew" : "membership.sell",
      entityType: "member_subscription", entityId: sub.id,
      after: {
        memberId: member.id, planId: plan.id, startsAt: sub.startsAt, endsAt: sub.endsAt,
        priceAmountRial: sub.priceAmountRial.toString(), discountAmountRial: sub.discountAmountRial.toString(),
      },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return sub;
  });
}

type Action = "suspend" | "resume" | "cancel";

export async function changeMembership(deps: CoreDeps, ctx: TenantContext, subscriptionId: string, action: Action, note?: string) {
  requirePermission(ctx, "memberships.manage");
  requireWritableGym(ctx);
  const now = nowOf(deps);
  return withTenant(deps.db, ctx, async (tx) => {
    const found = await tx.memberSubscription.findFirst({ where: { id: subscriptionId, gymId: ctx.gymId }, select: { memberId: true } });
    if (!found) throw notFound("اشتراک");
    await findAccessibleMember(tx, ctx, found.memberId);
    await tx.$queryRaw`SELECT id FROM "member_subscription" WHERE id = ${subscriptionId}::uuid FOR UPDATE`;
    const s = await tx.memberSubscription.findUniqueOrThrow({ where: { id: subscriptionId } });

    let data: Record<string, unknown>;
    if (action === "suspend") {
      if (s.status !== "ACTIVE" || s.endsAt <= now) throw new AppError("BUSINESS_RULE", "فقط اشتراک فعال و تمام‌نشده را می‌توان تعلیق کرد.");
      data = { status: "SUSPENDED", suspendedAt: now };
    } else if (action === "resume") {
      if (s.status !== "SUSPENDED" || !s.suspendedAt) throw new AppError("BUSINESS_RULE", "این اشتراک تعلیق نشده است.");
      // The suspended days are added back. Suspended before it started: the whole period moves later.
      const startedBeforeSuspension = s.suspendedAt.getTime() >= s.startsAt.getTime();
      const shift = startedBeforeSuspension
        ? Math.max(0, now.getTime() - s.suspendedAt.getTime())
        : Math.max(0, now.getTime() - s.startsAt.getTime());
      data = {
        status: "ACTIVE",
        suspendedAt: null,
        startsAt: startedBeforeSuspension ? s.startsAt : new Date(s.startsAt.getTime() + shift),
        endsAt: new Date(s.endsAt.getTime() + shift),
      };
    } else {
      if (s.status === "CANCELLED") throw new AppError("BUSINESS_RULE", "این اشتراک قبلاً لغو شده است.");
      data = { status: "CANCELLED", cancelledAt: now, suspendedAt: null };
    }
    if (note) data.note = s.note ? `${s.note}\n${note}` : note;
    const updated = await tx.memberSubscription.update({ where: { id: s.id }, data });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: `membership.${action}`, entityType: "member_subscription", entityId: s.id,
      before: { status: s.status, startsAt: s.startsAt, endsAt: s.endsAt },
      after: { status: updated.status, startsAt: updated.startsAt, endsAt: updated.endsAt, note: note ?? null },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return updated;
  });
}
