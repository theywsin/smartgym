"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarCheck, Dumbbell, UserRound } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { fa, jdate, toman } from "@/lib/client/format";
import { MembershipBadge, type MembershipSummary } from "@/components/membership-badge";
import { ErrorState, LoadingState } from "@/components/states";
import { CheckinPass } from "./checkin-pass";

type Exercise = { name: string; sets: number; reps: string; restSeconds?: number; note?: string };
type Dashboard = {
  member: { id: string; code: number; firstName: string; lastName: string; gymName: string };
  membership: MembershipSummary;
  subscriptions: { id: string; status: string; startsAt: string; endsAt: string; entryLimit: number | null; entriesUsed: number; planName: string }[];
  visits: { id: string; checkedInAt: string; checkedOutAt: string | null; branchName: string }[];
  visitsLast30Days: number;
  program: { id: string; title: string; goal: string | null; notes: string | null; days: { title: string; exercises: Exercise[] }[]; updatedAt: string } | null;
  coachName: string | null;
  payments: { id: string; amountRial: string; refundedAmountRial: string; method: string; paidAt: string }[];
  debts: { subscriptionId: string; dueRial: string; planName: string }[];
  onlinePaymentEnabled: boolean;
  profile: { phone: string | null; birthDate: string | null; gender: string | null; homeBranch: string | null; memberSince: string };
};
const METHOD: Record<string, string> = { CASH: "نقد", CARD: "کارتخوان", TRANSFER: "کارت‌به‌کارت", ONLINE: "آنلاین" };

const time = (d: string) => new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran" }).format(new Date(d));

export default function AthleteDashboard() {
  const { memberId } = useParams<{ memberId: string }>();
  const router = useRouter();
  const q = useQuery({ queryKey: ["athlete", memberId], queryFn: () => api<Dashboard>(`/athlete/profiles/${memberId}`) });
  const pay = useMutation({
    mutationFn: (subscriptionId: string) => api<{ resNum: string }>(`/athlete/profiles/${memberId}/pay`, { method: "POST", body: { subscriptionId } }),
    onSuccess: (r) => router.push(`/pay/${r.resNum}`),
  });
  if (q.isPending) return <LoadingState />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const d = q.data;
  const m = d.membership;
  return (
    <div className="space-y-4">
      <div>
        <Link href="/athlete" className="text-xs text-ink-2">{d.member.gymName}</Link>
        <h1 className="text-xl font-extrabold">سلام {d.member.firstName}</h1>
      </div>

      {m.state === "active" && <CheckinPass memberId={d.member.id} />}

      {d.debts.length > 0 && (
        <section className="card border-[#fde68a] bg-warn-bg p-5" aria-labelledby="debt">
          <h2 id="debt" className="mb-2 font-bold text-warn-tx">بدهی</h2>
          <ul className="space-y-2">
            {d.debts.map((x) => (
              <li key={x.subscriptionId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{x.planName}: <strong>{toman(x.dueRial)}</strong></span>
                {d.onlinePaymentEnabled && (
                  <button type="button" className="btn-primary h-9" disabled={pay.isPending} onClick={() => pay.mutate(x.subscriptionId)}>پرداخت آنلاین</button>
                )}
              </li>
            ))}
          </ul>
          {!d.onlinePaymentEnabled && <p className="mt-2 text-xs text-warn-tx">برای پرداخت به پذیرش باشگاه مراجعه کنید.</p>}
          {pay.isError && <p role="alert" className="field-error mt-2">{(pay.error as ApiError).message}</p>}
        </section>
      )}

      <section className="card p-5" aria-labelledby="ms">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="ms" className="font-bold">اشتراک</h2>
          <MembershipBadge m={m} />
        </div>
        {m.planName ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-ink-2">پلن</div><div className="font-bold">{m.planName}</div></div>
            <div><div className="text-ink-2">پایان</div><div className="font-bold">{jdate(m.endsAt)}</div></div>
            <div><div className="text-ink-2">روز باقی‌مانده</div><div className="text-2xl font-extrabold text-brand-700">{m.daysLeft !== null ? fa(m.daysLeft) : "—"}</div></div>
            <div><div className="text-ink-2">جلسات باقی‌مانده</div><div className="text-2xl font-extrabold">{m.entriesLeft !== null ? fa(m.entriesLeft) : "نامحدود"}</div></div>
          </div>
        ) : (
          <p className="text-sm text-ink-2">اشتراک فعالی ندارید. برای تمدید به پذیرش مراجعه کنید.</p>
        )}
        <div className="mt-3 border-t border-line pt-3 text-xs text-ink-2">شماره عضویت {fa(d.member.code)}</div>
      </section>

      <section className="card p-5" aria-labelledby="pg">
        <h2 id="pg" className="mb-3 flex items-center gap-2 font-bold"><Dumbbell className="size-4 text-brand-700" aria-hidden /> برنامه‌ی تمرینی</h2>
        {d.coachName && <p className="mb-3 flex items-center gap-1 text-xs text-ink-2"><UserRound className="size-3.5" aria-hidden /> مربی: {d.coachName}</p>}
        {!d.program ? (
          <p className="text-sm text-ink-2">هنوز برنامه‌ای برای شما ثبت نشده است.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="font-bold">{d.program.title}</div>
              {d.program.goal && <div className="text-sm text-ink-2">هدف: {d.program.goal}</div>}
              <div className="text-xs text-ink-3">به‌روزرسانی {jdate(d.program.updatedAt)}</div>
            </div>
            {d.program.days.map((day, i) => (
              <details key={i} open={i === 0} className="rounded-xl border border-line">
                <summary className="cursor-pointer px-4 py-3 font-bold">{day.title} <span className="text-xs font-normal text-ink-2">({fa(day.exercises.length)} حرکت)</span></summary>
                <ol className="divide-y divide-line border-t border-line">
                  {day.exercises.map((e, j) => (
                    <li key={j} className="px-4 py-3 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold">{e.name}</span>
                        <span className="text-ink-2">{fa(e.sets)} × <bdi dir="ltr">{fa(e.reps)}</bdi></span>
                      </div>
                      {(e.restSeconds != null || e.note) && (
                        <div className="mt-1 text-xs text-ink-2">
                          {e.restSeconds != null && <>استراحت {fa(e.restSeconds)} ثانیه</>}
                          {e.restSeconds != null && e.note && " · "}
                          {e.note}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </details>
            ))}
            {d.program.notes && <p className="whitespace-pre-line text-sm text-ink-2">{d.program.notes}</p>}
          </div>
        )}
      </section>

      <section className="card p-5" aria-labelledby="at">
        <h2 id="at" className="mb-1 flex items-center gap-2 font-bold"><CalendarCheck className="size-4 text-brand-700" aria-hidden /> حضور</h2>
        <p className="mb-3 text-sm text-ink-2">{fa(d.visitsLast30Days)} جلسه در ۳۰ روز گذشته</p>
        {d.visits.length === 0 ? (
          <p className="text-sm text-ink-2">هنوز حضوری ثبت نشده است.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {d.visits.map((v) => (
              <li key={v.id} className="flex justify-between py-2">
                <span>{jdate(v.checkedInAt)} <span className="text-ink-2">{time(v.checkedInAt)}</span></span>
                <span className="text-ink-2">{v.branchName}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href={`/athlete/${d.member.id}/tickets`} className="card flex items-center justify-between p-5 font-bold hover:border-brand-200">
        پیام به باشگاه <span className="text-sm font-normal text-ink-2">پرسش، انتقاد یا پیشنهاد</span>
      </Link>

      {d.payments.length > 0 && (
        <section className="card p-5" aria-labelledby="pay-h">
          <h2 id="pay-h" className="mb-3 font-bold">پرداخت‌های من</h2>
          <ul className="divide-y divide-line text-sm">
            {d.payments.map((p) => (
              <li key={p.id} className="flex justify-between py-2">
                <span>{toman(p.amountRial)} <span className="text-ink-2">{METHOD[p.method] ?? p.method}</span>{p.refundedAmountRial !== "0" && <span className="block text-xs text-err-tx">بازگشت {toman(p.refundedAmountRial)}</span>}</span>
                <span className="text-ink-2">{jdate(p.paidAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-5" aria-labelledby="prof">
        <h2 id="prof" className="mb-3 font-bold">مشخصات من</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-ink-2">نام</dt><dd className="font-semibold">{d.member.firstName} {d.member.lastName}</dd></div>
          <div><dt className="text-ink-2">شماره عضویت</dt><dd className="font-semibold">{fa(d.member.code)}</dd></div>
          <div><dt className="text-ink-2">شعبه</dt><dd>{d.profile.homeBranch ?? "—"}</dd></div>
          <div><dt className="text-ink-2">عضویت از</dt><dd>{jdate(d.profile.memberSince)}</dd></div>
          <div><dt className="text-ink-2">تاریخ تولد</dt><dd>{jdate(d.profile.birthDate)}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-ink-2">برای اصلاح مشخصات به پذیرش باشگاه بگویید یا از «پیام به باشگاه» استفاده کنید.</p>
      </section>

      {d.subscriptions.length > 1 && (
        <section className="card p-5" aria-labelledby="hs">
          <h2 id="hs" className="mb-3 font-bold">سابقه‌ی اشتراک</h2>
          <ul className="divide-y divide-line text-sm">
            {d.subscriptions.map((s) => (
              <li key={s.id} className="flex justify-between py-2">
                <span>{s.planName}</span>
                <span className="text-ink-2">{jdate(s.startsAt)} تا {jdate(s.endsAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
