"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toPersianDigits, formatIranMobile } from "@smartgym/shared";
import { api, ApiError } from "@/lib/client/api";
import { fa, jdate, toman } from "@/lib/client/format";
import { ErrorState, LoadingState } from "@/components/states";
import { Field } from "@/components/field";

type Gym = {
  id: string; name: string; slug: string; status: string; createdAt: string;
  owner: { id: string; phone: string; name: string | null };
  branches: { id: string; name: string; address: string | null; phone: string | null; isActive: boolean }[];
  staff: { userId: string; phone: string; name: string | null; role: string }[];
  subscriptions: { id: string; plan: string; status: string; startsAt: string; endsAt: string }[];
  stats: { members: number; activeMemberSubs: number; payments30d: { count: number; rial: string }; paymentsAll: { count: number; rial: string } };
  terminalId: string | null;
};
const phone = (p: string) => toPersianDigits(formatIranMobile(p));

export default function AdminGymPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const q = useQuery({ queryKey: ["admin", "gym", id], queryFn: () => api<Gym>(`/admin/gyms/${id}`) });
  if (q.isPending) return <LoadingState />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const g = q.data;
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-ink-2 hover:text-ink">← باشگاه‌ها</Link>
        <h1 className="page-title mt-1">{g.name}</h1>
        <p className="text-sm text-ink-2"><span dir="ltr">{g.slug}</span> · ساخته‌شده {jdate(g.createdAt)} · مالک: <Link className="text-brand-700 hover:underline" href={`/admin/users/${g.owner.id}`}>{g.owner.name ?? phone(g.owner.phone)}</Link></p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-4">
        {([["اعضا", fa(g.stats.members)], ["اشتراک فعال اعضا", fa(g.stats.activeMemberSubs)], ["دریافتی ۳۰ روز", toman(g.stats.payments30d.rial)], ["کل دریافتی", toman(g.stats.paymentsAll.rial)]] as const).map(([k, v]) => (
          <div key={k} className="card p-4"><dt className="text-xs text-ink-2">{k}</dt><dd className="mt-1 text-lg font-extrabold">{v}</dd></div>
        ))}
      </dl>
      <EditForm g={g} />
      <section className="card space-y-3" aria-labelledby="st-t">
        <h2 id="st-t" className="card-title">کارکنان ({fa(g.staff.length)})</h2>
        <ul className="divide-y divide-line text-sm">
          {g.staff.map((s, i) => (
            <li key={`${s.userId}${i}`} className="flex flex-wrap justify-between gap-2 py-2">
              <Link href={`/admin/users/${s.userId}`} className="font-semibold hover:text-brand-700">{s.name ?? "بدون نام"} <span className="ltr-nums text-xs font-normal text-ink-3">{phone(s.phone)}</span></Link>
              <span className="chip text-xs">{s.role}</span>
            </li>
          ))}
        </ul>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-3" aria-labelledby="br-t">
          <h2 id="br-t" className="card-title">شعبه‌ها</h2>
          <ul className="space-y-2 text-sm">{g.branches.map((b) => <li key={b.id}><b>{b.name}</b>{!b.isActive && <span className="chip mr-2 text-xs">غیرفعال</span>} <span className="text-ink-2">{b.address}</span></li>)}</ul>
        </section>
        <section className="card space-y-3" aria-labelledby="sub-t">
          <h2 id="sub-t" className="card-title">سابقه‌ی اشتراک پلتفرم</h2>
          <ul className="space-y-2 text-sm">{g.subscriptions.map((s) => <li key={s.id} className="flex justify-between gap-2"><span>{s.plan} <span className="text-xs text-ink-3">({s.status})</span></span><span className="text-xs text-ink-2">{jdate(s.startsAt)} تا {jdate(s.endsAt)}</span></li>)}</ul>
          <p className="text-xs text-ink-3">تغییر پلن و وضعیت از فهرست باشگاه‌ها انجام می‌شود.</p>
        </section>
      </div>
    </div>
  );
}

function EditForm({ g }: { g: Gym }) {
  const qc = useQueryClient();
  const [name, setName] = useState(g.name);
  const [terminalId, setTerminal] = useState(g.terminalId ?? "");
  const save = useMutation({
    mutationFn: (body: { name: string; terminalId: string | null }) => api(`/admin/gyms/${g.id}`, { method: "PUT", body }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin"] }),
  });
  const err = save.error instanceof ApiError ? save.error.fields : undefined;
  return (
    <form className="card space-y-4" aria-labelledby="ed-t" onSubmit={(e) => { e.preventDefault(); save.mutate({ name, terminalId: terminalId.trim() || null }); }}>
      <h2 id="ed-t" className="card-title">ویرایش باشگاه</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="نام باشگاه" error={err?.name?.[0]}><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="شماره ترمینال سامان (درگاه پرداخت)" error={err?.terminalId?.[0]} hint="خالی = پرداخت آنلاین برای این باشگاه غیرفعال">
          <input className="input ltr-nums" dir="ltr" inputMode="numeric" value={terminalId} onChange={(e) => setTerminal(e.target.value)} />
        </Field>
      </div>
      {save.isError && <p role="alert" className="field-error">{(save.error as ApiError).message}</p>}
      {save.isSuccess && <p role="status" className="text-sm text-brand-700">ذخیره شد.</p>}
      <button className="btn-primary" disabled={save.isPending}>ذخیره</button>
    </form>
  );
}
