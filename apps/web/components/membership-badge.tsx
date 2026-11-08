import { toPersianDigits } from "@smartgym/shared";

export type MembershipState = "active" | "exhausted" | "suspended" | "upcoming" | "expired" | "none";
export type MembershipSummary = {
  state: MembershipState;
  subscriptionId: string | null;
  planName: string | null;
  startsAt: string | null;
  endsAt: string | null;
  daysLeft: number | null;
  entriesLeft: number | null;
};

const STYLE: Record<MembershipState | "expiring", { label: string; cls: string }> = {
  active: { label: "فعال", cls: "border-brand-200 bg-brand-50 text-brand-700" },
  expiring: { label: "رو به اتمام", cls: "border-[#fde68a] bg-warn-bg text-warn-tx" },
  exhausted: { label: "جلسات تمام شده", cls: "border-[#fde68a] bg-warn-bg text-warn-tx" },
  suspended: { label: "تعلیق", cls: "border-[#bfdbfe] bg-info-bg text-info-tx" },
  upcoming: { label: "شروع آینده", cls: "border-[#bfdbfe] bg-info-bg text-info-tx" },
  expired: { label: "منقضی", cls: "border-[#fecaca] bg-err-bg text-err-tx" },
  none: { label: "بدون اشتراک", cls: "border-line bg-line-2 text-ink-2" },
};

export function MembershipBadge({ m }: { m: Pick<MembershipSummary, "state" | "daysLeft"> }) {
  const key = m.state === "active" && m.daysLeft !== null && m.daysLeft <= 7 ? "expiring" : m.state;
  const s = STYLE[key];
  return (
    <span className={`chip font-semibold ${s.cls}`}>
      {s.label}
      {key === "expiring" && m.daysLeft !== null && <span className="font-normal">({toPersianDigits(m.daysLeft)} روز)</span>}
    </span>
  );
}
