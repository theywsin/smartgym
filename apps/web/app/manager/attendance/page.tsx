"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, LogIn, LogOut, Search } from "lucide-react";
import { formatIranMobile, formatTehranTime, toPersianDigits } from "@smartgym/shared";
import { api, ApiError } from "@/lib/client/api";
import { useCan, useMe } from "@/lib/client/me";
import { fa, jdate } from "@/lib/client/format";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { MembershipBadge, type MembershipSummary } from "@/components/membership-badge";

type Branch = { id: string; name: string };
type Visit = {
  id: string; branchId: string; checkedInAt: string; checkedOutAt: string | null; planName: string;
  member: { id: string; code: number; firstName: string; lastName: string };
};
type Day = { total: number; inside: number; items: Visit[] };
type Found = { id: string; code: number; firstName: string; lastName: string; phone: string | null; membership: MembershipSummary };
type CheckInResult = { member: { firstName: string; lastName: string }; planName: string; daysLeft: number; entriesLeft: number | null; warning: string | null };

export default function AttendancePage() {
  const qc = useQueryClient();
  const me = useMe();
  const canManage = useCan("attendance.manage");
  const branches = useQuery({ queryKey: ["branches"], queryFn: () => api<Branch[]>("/branches") });
  const scoped = me.access?.branchIds ?? null;
  const allowed = (branches.data ?? []).filter((b) => !scoped || scoped.includes(b.id));
  const [branchId, setBranchId] = useState("");
  const branch = branchId || allowed[0]?.id || "";

  const day = useQuery({
    queryKey: ["attendance", branch],
    queryFn: () => api<Day>(`/attendance?pageSize=100&branchId=${branch}`),
    enabled: !!branch,
    refetchInterval: 30_000,
  });

  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);
  const found = useQuery({
    queryKey: ["members", "checkin-search", debounced],
    queryFn: () => api<{ items: Found[] }>(`/members?pageSize=6&q=${encodeURIComponent(debounced)}`),
    enabled: debounced.length >= 2,
  });

  const [result, setResult] = useState<CheckInResult | null>(null);
  const checkIn = useMutation({
    mutationFn: (memberId: string) => api<CheckInResult>("/attendance/check-in", { method: "POST", body: { memberId, branchId: branch } }),
    onSuccess: (r) => {
      setResult(r);
      setQ("");
      void qc.invalidateQueries({ queryKey: ["attendance"] });
      void qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: () => setResult(null),
  });
  const checkOut = useMutation({
    mutationFn: (id: string) => api(`/attendance/${id}/check-out`, { method: "POST" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["attendance"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">حضور و غیاب</h1>
          <p className="text-sm text-ink-2">امروز، {jdate(new Date())}</p>
        </div>
        {allowed.length > 1 && (
          <label className="flex items-center gap-2 text-sm">
            شعبه
            <select className="input h-10 w-auto" value={branch} onChange={(e) => setBranchId(e.target.value)}>
              {allowed.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-sm text-ink-2">ورود امروز</p>
          <p className="text-3xl font-extrabold">{day.data ? fa(day.data.total) : "—"}</p>
        </div>
        <div className="card">
          <p className="text-sm text-ink-2">داخل باشگاه</p>
          <p className="text-3xl font-extrabold text-brand-700">{day.data ? fa(day.data.inside) : "—"}</p>
        </div>
      </div>

      {canManage && (
        <section className="card space-y-3" aria-labelledby="checkin-title">
          <h2 id="checkin-title" className="card-title">ثبت ورود</h2>
          <label className="relative block">
            <span className="sr-only">جستجوی عضو</span>
            <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <input className="input h-12 pr-9 text-base" placeholder="نام، موبایل یا کد عضویت" value={q} onChange={(e) => { setQ(e.target.value); checkIn.reset(); }} autoFocus />
          </label>
          <div role="status" aria-live="polite">
            {checkIn.error && <p className="rounded-lg bg-err-bg p-3 text-sm font-semibold text-err-tx">{(checkIn.error as ApiError).message}</p>}
            {result && (
              <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
                <strong>ورود {result.member.firstName} {result.member.lastName} ثبت شد.</strong>{" "}
                {result.planName}، {fa(result.daysLeft)} روز
                {result.entriesLeft !== null && `، ${fa(result.entriesLeft)} جلسه`} باقی مانده.
                {result.warning && <span className="block font-semibold text-warn-tx">هشدار تمدید: {result.warning}</span>}
              </p>
            )}
          </div>
          {debounced.length >= 2 && (
            <ul className="divide-y divide-line rounded-xl border border-line">
              {found.isPending && <li className="p-3 text-sm text-ink-2">در حال جستجو…</li>}
              {found.data?.items.length === 0 && <li className="p-3 text-sm text-ink-2">عضوی پیدا نشد.</li>}
              {found.data?.items.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/manager/members/${m.id}`} className="font-semibold hover:underline">{m.firstName} {m.lastName}</Link>
                    <p className="text-xs text-ink-3">
                      <span className="ltr-nums">SG-{toPersianDigits(m.code)}</span>
                      {m.phone && <>، <span className="ltr-nums">{toPersianDigits(formatIranMobile(m.phone))}</span></>}
                    </p>
                  </div>
                  <MembershipBadge m={m.membership} />
                  <button type="button" className="btn-primary h-9" disabled={checkIn.isPending || !branch} onClick={() => checkIn.mutate(m.id)}>
                    {checkIn.isPending && checkIn.variables === m.id ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LogIn className="size-4" aria-hidden />}
                    ورود
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="card p-0" aria-labelledby="today-title">
        <h2 id="today-title" className="card-title p-5 pb-3">ورودهای امروز</h2>
        {(day.isPending && !!branch) && <LoadingState />}
        {day.isError && <div className="p-4"><ErrorState error={day.error} onRetry={() => day.refetch()} /></div>}
        {day.data?.items.length === 0 && <EmptyState title="امروز هنوز ورودی ثبت نشده است" />}
        {day.data && day.data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-right text-xs text-ink-2">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold">عضو</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">پلن</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">ورود</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">خروج</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {day.data.items.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-3">
                      <Link href={`/manager/members/${v.member.id}`} className="font-semibold hover:underline">{v.member.firstName} {v.member.lastName}</Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{v.planName}</td>
                    <td className="px-4 py-3"><span className="ltr-nums">{formatTehranTime(v.checkedInAt)}</span></td>
                    <td className="px-4 py-3">
                      {v.checkedOutAt ? (
                        <span className="ltr-nums text-ink-2">{formatTehranTime(v.checkedOutAt)}</span>
                      ) : canManage ? (
                        <button type="button" className="btn-secondary h-8 px-3 text-xs" disabled={checkOut.isPending} onClick={() => checkOut.mutate(v.id)}>
                          <LogOut className="size-3.5" aria-hidden />
                          ثبت خروج
                        </button>
                      ) : (
                        <span className="chip-brand">داخل باشگاه</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
