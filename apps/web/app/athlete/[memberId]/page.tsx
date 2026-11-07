"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Dumbbell, UserRound } from "lucide-react";
import { api } from "@/lib/client/api";
import { fa, jdate } from "@/lib/client/format";
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
};

const time = (d: string) => new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran" }).format(new Date(d));

export default function AthleteDashboard() {
  const { memberId } = useParams<{ memberId: string }>();
  const q = useQuery({ queryKey: ["athlete", memberId], queryFn: () => api<Dashboard>(`/athlete/profiles/${memberId}`) });
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
