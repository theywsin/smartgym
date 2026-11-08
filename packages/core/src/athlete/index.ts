import { onlinePaymentsEnabled } from "../admin/integrations";
import { withSystem } from "@smartgym/db";
import { notFound } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { membershipSummary, SUMMARY_SUBS_INCLUDE } from "../memberships/state";

/**
 * Athlete (member-facing) read access.
 *
 * A signed-in user sees the member records whose phone equals their own OTP-verified phone.
 * The member id in the URL is never trusted: every read re-checks the phone match on the server.
 * Reads run with RLS bypass because an athlete has no staff membership in the gym; each query
 * is scoped to the single matched member.
 */
export type AthleteUser = { id: string; phone: string };

const memberMatch = (user: AthleteUser) => ({
  phone: user.phone,
  status: "ACTIVE" as const,
  archivedAt: null,
  gym: { status: { not: "SUSPENDED" as const } },
});

export async function listMyMemberProfiles(deps: CoreDeps, user: AthleteUser) {
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => {
    const rows = await tx.member.findMany({
      where: memberMatch(user),
      include: { gym: { select: { name: true } }, subscriptions: SUMMARY_SUBS_INCLUDE },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
    return rows.map((m) => ({
      memberId: m.id,
      gymName: m.gym.name,
      firstName: m.firstName,
      lastName: m.lastName,
      code: m.code,
      membership: membershipSummary(m.subscriptions, now),
    }));
  });
}

/** The matched member row, or NOT_FOUND. */
export async function getAthleteDashboardMember(deps: CoreDeps, user: AthleteUser, memberId: string) {
  const m = await withSystem(deps.db, (tx) => tx.member.findFirst({ where: { id: memberId, ...memberMatch(user) }, select: { id: true, gymId: true } }));
  if (!m) throw notFound("عضو");
  return m;
}

export async function getAthleteDashboard(deps: CoreDeps, user: AthleteUser, memberId: string) {
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => {
    const m = await tx.member.findFirst({
      where: { id: memberId, ...memberMatch(user) },
      include: { gym: { select: { name: true } }, subscriptions: SUMMARY_SUBS_INCLUDE },
    });
    if (!m) throw notFound("عضو");
    const [subscriptions, visits, monthVisits, program, coach, payments] = await Promise.all([
      tx.memberSubscription.findMany({
        where: { gymId: m.gymId, memberId: m.id, status: { not: "CANCELLED" } },
        orderBy: { startsAt: "desc" },
        take: 10,
        select: { id: true, status: true, startsAt: true, endsAt: true, entryLimit: true, entriesUsed: true, plan: { select: { name: true } } },
      }),
      tx.attendance.findMany({
        where: { gymId: m.gymId, memberId: m.id },
        orderBy: { checkedInAt: "desc" },
        take: 20,
        select: { id: true, checkedInAt: true, checkedOutAt: true, branch: { select: { name: true } } },
      }),
      tx.attendance.count({ where: { gymId: m.gymId, memberId: m.id, checkedInAt: { gte: new Date(now.getTime() - 30 * 86_400_000) } } }),
      tx.workoutProgram.findFirst({
        where: { gymId: m.gymId, memberId: m.id, isActive: true },
        select: { id: true, title: true, goal: true, notes: true, days: true, updatedAt: true },
      }),
      tx.coachAthlete.findFirst({ where: { gymId: m.gymId, memberId: m.id, endedAt: null }, select: { coachUserId: true } }),
      tx.payment.findMany({
        where: { gymId: m.gymId, memberId: m.id }, orderBy: { paidAt: "desc" }, take: 20,
        select: { id: true, amountRial: true, refundedAmountRial: true, method: true, paidAt: true },
      }),
    ]);
    const balances = await tx.payment.groupBy({
      by: ["subscriptionId"], where: { subscriptionId: { in: subscriptions.map((s) => s.id) } },
      _sum: { amountRial: true, refundedAmountRial: true },
    });
    const prices = await tx.memberSubscription.findMany({ where: { id: { in: subscriptions.map((s) => s.id) } }, select: { id: true, priceAmountRial: true, discountAmountRial: true } });
    const debts = prices
      .map((p) => {
        const b = balances.find((x) => x.subscriptionId === p.id);
        const paid = (b?._sum.amountRial ?? 0n) - (b?._sum.refundedAmountRial ?? 0n);
        return { subscriptionId: p.id, dueRial: p.priceAmountRial - p.discountAmountRial - paid };
      })
      .filter((d) => d.dueRial > 0n)
      .map((d) => ({ ...d, planName: subscriptions.find((s) => s.id === d.subscriptionId)!.plan.name }));
    const onlinePay = await tx.gymSetting.findUnique({ where: { gymId_key: { gymId: m.gymId, key: "payments.saman" } }, select: { value: true } });
    const coachProfile = coach
      ? await tx.userProfile.findUnique({ where: { userId: coach.coachUserId }, select: { firstName: true, lastName: true } })
      : null;
    return {
      member: { id: m.id, code: m.code, firstName: m.firstName, lastName: m.lastName, gymName: m.gym.name },
      membership: membershipSummary(m.subscriptions, now),
      subscriptions: subscriptions.map((s) => ({ ...s, planName: s.plan.name, plan: undefined })),
      visits: visits.map((v) => ({ id: v.id, checkedInAt: v.checkedInAt, checkedOutAt: v.checkedOutAt, branchName: v.branch.name })),
      visitsLast30Days: monthVisits,
      program,
      payments,
      debts,
      onlinePaymentEnabled: !!(onlinePay?.value as { terminalId?: string | null } | null)?.terminalId && (await onlinePaymentsEnabled(deps)),
      profile: { phone: m.phone, birthDate: m.birthDate, gender: m.gender, homeBranch: m.homeBranchId ? (await tx.branch.findUnique({ where: { id: m.homeBranchId }, select: { name: true } }))?.name ?? null : null, memberSince: m.createdAt },
      coachName: coachProfile ? [coachProfile.firstName, coachProfile.lastName].filter(Boolean).join(" ") || null : null,
    };
  });
}
