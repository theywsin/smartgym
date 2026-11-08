"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toPersianDigits, formatIranMobile } from "@smartgym/shared";
import { api, ApiError } from "@/lib/client/api";
import { fa, jdate, toman } from "@/lib/client/format";
import { ErrorState, LoadingState, EmptyState } from "@/components/states";

type GymStatus = "TRIAL" | "ACTIVE" | "SUSPENDED" | "CLOSED";
type Overview = { gymsByStatus: Partial<Record<GymStatus, number>>; members: number; newGymsLast30Days: number; paying: number; trialing: number; mrrRial: string };
type Gym = {
  id: string; name: string; slug: string; status: GymStatus; createdAt: string; ownerPhone: string; members: number; branches: number;
  subscription: { planKey: string; planName: string; status: string; endsAt: string } | null;
};
type Plan = { key: string; nameFa: string; monthlyAmountRial: string };

const STATUS: Record<GymStatus, { label: string; cls: string }> = {
  TRIAL: { label: "آزمایشی", cls: "border-[#bfdbfe] bg-info-bg text-info-tx" },
  ACTIVE: { label: "فعال", cls: "border-brand-200 bg-brand-50 text-brand-700" },
  SUSPENDED: { label: "تعلیق", cls: "border-[#fde68a] bg-warn-bg text-warn-tx" },
  CLOSED: { label: "بسته", cls: "border-[#fecaca] bg-err-bg text-err-tx" },
};

export default function AdminPage() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<GymStatus | "">("");
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { const t = setTimeout(() => setDebounced(q.trim()), 250); return () => clearTimeout(t); }, [q]);

  const overview = useQuery({ queryKey: ["admin", "overview"], queryFn: () => api<Overview>("/admin/overview"), retry: false });
  const gyms = useQuery({
    queryKey: ["admin", "gyms", debounced, status],
    queryFn: () => api<{ total: number; items: Gym[] }>(`/admin/gyms?pageSize=50&q=${encodeURIComponent(debounced)}${status ? `&status=${status}` : ""}`),
    enabled: overview.isSuccess,
  });

  if (overview.isPending) return <LoadingState />;
  if (overview.isError) return <ErrorState error={overview.error} />;
  const o = overview.data;
  const cards = [
    ["باشگاه‌ها", Object.values(o.gymsByStatus).reduce((a, b) => a + (b ?? 0), 0)],
    ["پرداخت‌کننده", o.paying],
    ["دوره‌ی آزمایشی", o.trialing],
    ["تعلیق", o.gymsByStatus.SUSPENDED ?? 0],
    ["ثبت‌نام ۳۰ روز اخیر", o.newGymsLast30Days],
    ["کل اعضا", o.members],
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">باشگاه‌های پلتفرم</h1>
        <p className="text-sm text-ink-2">درآمد ماهانه‌ی تکرارشونده: <strong>{toman(o.mrrRial)}</strong></p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(([label, n]) => (
          <div key={label} className="card">
            <p className="text-xs text-ink-2">{label}</p>
            <p className="text-2xl font-extrabold">{fa(n)}</p>
          </div>
        ))}
      </div>

      <section className="card space-y-4">
        <div className="flex flex-wrap gap-2">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">جستجو</span>
            <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <input className="input pr-9" placeholder="نام باشگاه یا موبایل مالک" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <select className="input w-auto" aria-label="وضعیت" value={status} onChange={(e) => setStatus(e.target.value as GymStatus | "")}>
            <option value="">همه‌ی وضعیت‌ها</option>
            {(Object.keys(STATUS) as GymStatus[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
          </select>
        </div>
        {gyms.isPending && <LoadingState />}
        {gyms.isError && <ErrorState error={gyms.error} onRetry={() => gyms.refetch()} />}
        {gyms.data?.items.length === 0 && <EmptyState title="باشگاهی پیدا نشد" />}
        {gyms.data && gyms.data.items.length > 0 && (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {gyms.data.items.map((g) => (
              <li key={g.id}>
                <button type="button" className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 p-3 text-right hover:bg-line-2" onClick={() => setOpen(open === g.id ? null : g.id)} aria-expanded={open === g.id}>
                  <span className="min-w-[160px] flex-1">
                    <span className="block font-bold">{g.name}</span>
                    <span className="ltr-nums text-xs text-ink-3">{toPersianDigits(formatIranMobile(g.ownerPhone))}</span>
                  </span>
                  <span className={`chip font-semibold ${STATUS[g.status].cls}`}>{STATUS[g.status].label}</span>
                  <span className="w-36 text-sm">{g.subscription ? <>{g.subscription.planName} <span className="text-xs text-ink-2">تا {jdate(g.subscription.endsAt)}</span></> : <span className="text-err-tx">بدون اشتراک</span>}</span>
                  <span className="w-20 text-sm text-ink-2">{fa(g.members)} عضو</span>
                  <span className="w-24 text-xs text-ink-3">{jdate(g.createdAt)}</span>
                </button>
                {open === g.id && <GymActions gym={g} />}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function GymActions({ gym }: { gym: Gym }) {
  const qc = useQueryClient();
  const plans = useQuery({ queryKey: ["admin", "plans"], queryFn: () => api<Plan[]>("/admin/plans") });
  const [planKey, setPlanKey] = useState(gym.subscription?.planKey ?? "pro");
  const [months, setMonths] = useState("1");
  const [newStatus, setNewStatus] = useState<GymStatus>(gym.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED");
  const [reason, setReason] = useState("");
  const done = () => void qc.invalidateQueries({ queryKey: ["admin"] });
  // Values go through mutate() so a fast submit never uses a stale closure.
  const plan = useMutation({ mutationFn: (body: { planKey: string; months: string }) => api(`/admin/gyms/${gym.id}/plan`, { method: "POST", body }), onSuccess: done });
  const st = useMutation({ mutationFn: (body: { status: GymStatus; reason: string }) => api(`/admin/gyms/${gym.id}/status`, { method: "POST", body }), onSuccess: () => { setReason(""); done(); } });

  return (
    <div className="grid gap-4 border-t border-line bg-line-2/50 p-4 sm:grid-cols-2">
      <Link href={`/admin/gyms/${gym.id}`} className="btn-secondary h-9 w-fit sm:col-span-2">جزئیات کامل، کارکنان، پرداخت‌ها و درگاه سامان</Link>
      <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); plan.mutate({ planKey, months }); }}>
        <h3 className="text-sm font-bold">ثبت اشتراک پرداخت‌شده</h3>
        <div className="flex gap-2">
          <select className="input" aria-label="پلن" value={planKey} onChange={(e) => setPlanKey(e.target.value)}>
            {plans.data?.map((p) => <option key={p.key} value={p.key}>{p.nameFa} ({toman(p.monthlyAmountRial)} ماهانه)</option>)}
          </select>
          <select className="input w-28" aria-label="مدت" value={months} onChange={(e) => setMonths(e.target.value)}>
            {[1, 3, 6, 12].map((m) => <option key={m} value={m}>{fa(m)} ماه</option>)}
          </select>
        </div>
        <button className="btn-primary h-9" disabled={plan.isPending}>ثبت اشتراک</button>
        {plan.isError && <p className="text-sm text-err-tx">{(plan.error as ApiError).message}</p>}
        {plan.isSuccess && <p className="text-sm text-brand-700">ثبت شد.</p>}
      </form>
      <form className="space-y-2" onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        st.mutate({ status: String(f.get("status")) as GymStatus, reason: String(f.get("reason") ?? "") });
      }}>
        <h3 className="text-sm font-bold">تغییر وضعیت</h3>
        <div className="flex gap-2">
          <select name="status" className="input w-32" aria-label="وضعیت جدید" value={newStatus} onChange={(e) => setNewStatus(e.target.value as GymStatus)}>
            {(Object.keys(STATUS) as GymStatus[]).filter((s) => s !== gym.status).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
          </select>
          <input className="input" placeholder="دلیل (در گزارش ثبت می‌شود)" aria-label="دلیل" name="reason" required minLength={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <button className={newStatus === "SUSPENDED" || newStatus === "CLOSED" ? "btn-secondary h-9 text-err-tx" : "btn-secondary h-9"} disabled={st.isPending}>اعمال</button>
        {st.isError && <p className="text-sm text-err-tx">{(st.error as ApiError).message}</p>}
      </form>
    </div>
  );
}
