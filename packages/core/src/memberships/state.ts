/**
 * Membership state is derived, never stored on the member:
 *   active     a running ACTIVE period with entries left
 *   exhausted  a running period whose entry limit is used up
 *   suspended  the latest relevant period is SUSPENDED
 *   upcoming   paid for, starts in the future
 *   expired    had periods, none running
 *   none       never had a period
 */
export type MembershipState = "active" | "exhausted" | "suspended" | "upcoming" | "expired" | "none";

const DAY = 86_400_000;

export function runningWhere(now: Date) {
  return { status: "ACTIVE" as const, startsAt: { lte: now }, endsAt: { gt: now } };
}

/** Enough subscriptions to compute the summary for a list row. */
export const SUMMARY_SUBS_INCLUDE = {
  where: { status: { in: ["ACTIVE" as const, "SUSPENDED" as const] } },
  orderBy: { endsAt: "desc" as const },
  take: 5,
  include: { plan: { select: { name: true } } },
};

type SubLike = {
  id: string;
  status: "ACTIVE" | "SUSPENDED" | "CANCELLED";
  startsAt: Date;
  endsAt: Date;
  entryLimit: number | null;
  entriesUsed: number;
  plan: { name: string };
};

export function membershipSummary(subs: readonly SubLike[], now: Date) {
  const relevant = subs.filter((s) => s.status !== "CANCELLED");
  const t = now.getTime();
  const running = relevant
    .filter((s) => s.status === "ACTIVE" && s.startsAt.getTime() <= t && s.endsAt.getTime() > t)
    .sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime());
  const usable = running.find((s) => s.entryLimit === null || s.entriesUsed < s.entryLimit);
  const pick = (state: MembershipState, s: SubLike | undefined) => ({
    state,
    subscriptionId: s?.id ?? null,
    planName: s?.plan.name ?? null,
    startsAt: s?.startsAt ?? null,
    endsAt: s?.endsAt ?? null,
    daysLeft: s ? Math.max(0, Math.ceil((s.endsAt.getTime() - t) / DAY)) : null,
    entriesLeft: s && s.entryLimit !== null ? Math.max(0, s.entryLimit - s.entriesUsed) : null,
  });
  if (usable) return pick("active", usable);
  if (running[0]) return pick("exhausted", running[0]);
  const suspended = relevant.find((s) => s.status === "SUSPENDED" && s.endsAt.getTime() > t);
  if (suspended) return pick("suspended", suspended);
  const upcoming = relevant
    .filter((s) => s.status === "ACTIVE" && s.startsAt.getTime() > t)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];
  if (upcoming) return pick("upcoming", upcoming);
  const last = [...subs].sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime())[0];
  return last ? pick("expired", last) : pick("none", undefined);
}
