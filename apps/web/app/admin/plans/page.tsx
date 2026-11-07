"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { fa, toman, tomanInputToRial } from "@/lib/client/format";
import { ErrorState, LoadingState } from "@/components/states";
import { Field } from "@/components/field";

type Plan = {
  id: string; key: string; nameFa: string; monthlyAmountRial: string; annualAmountRial: string; trialDays: number;
  limits: { members?: number | null; branches?: number | null }; isActive: boolean; modules: string[]; liveSubscriptions: number;
};
type Data = { modules: { key: string; nameFa: string }[]; plans: Plan[] };

export default function PlansPage() {
  const q = useQuery({ queryKey: ["admin", "plans-full"], queryFn: () => api<Data>("/admin/plans?full=1") });
  const [editing, setEditing] = useState<Plan | "new" | null>(null);
  if (q.isPending) return <LoadingState />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const name = new Map(q.data.modules.map((m) => [m.key, m.nameFa]));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">پلن‌های اشتراک</h1>
          <p className="text-sm text-ink-2">قیمت، ماژول‌ها و محدودیت‌ها؛ تغییر ماژول‌ها فوراً روی باشگاه‌های همان پلن اعمال می‌شود.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setEditing("new")}><Plus className="size-4" aria-hidden /> پلن جدید</button>
      </div>
      {editing && <PlanEditor plan={editing === "new" ? null : editing} modules={q.data.modules} onClose={() => setEditing(null)} />}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {q.data.plans.map((p) => (
          <article key={p.id} className={`card space-y-3 ${p.isActive ? "" : "opacity-60"}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold">{p.nameFa}</h2>
                <p className="ltr-nums text-xs text-ink-3">{p.key}</p>
              </div>
              {!p.isActive && <span className="chip">غیرفعال</span>}
            </div>
            <p><strong className="text-xl">{toman(p.monthlyAmountRial)}</strong> <span className="text-sm text-ink-2">ماهانه</span></p>
            <p className="text-sm text-ink-2">سالانه {toman(p.annualAmountRial)}، {fa(p.trialDays)} روز آزمایشی</p>
            <p className="text-sm">تا {p.limits.members ? fa(p.limits.members) : "نامحدود"} عضو، {p.limits.branches ? fa(p.limits.branches) : "نامحدود"} شعبه</p>
            <ul className="flex flex-wrap gap-1">{p.modules.map((m) => <li key={m} className="chip text-xs">{name.get(m) ?? m}</li>)}</ul>
            <div className="flex items-center justify-between border-t border-line pt-3">
              <span className="text-xs text-ink-2">{fa(p.liveSubscriptions)} باشگاه فعال</span>
              <button type="button" className="btn-secondary h-8 text-sm" onClick={() => setEditing(p)}>ویرایش</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function PlanEditor({ plan, modules, onClose }: { plan: Plan | null; modules: Data["modules"]; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    key: plan?.key ?? "", nameFa: plan?.nameFa ?? "",
    monthly: plan ? (BigInt(plan.monthlyAmountRial) / 10n).toString() : "", annual: plan ? (BigInt(plan.annualAmountRial) / 10n).toString() : "",
    trialDays: String(plan?.trialDays ?? 14), members: plan?.limits.members ? String(plan.limits.members) : "", branches: plan?.limits.branches ? String(plan.limits.branches) : "",
    modules: new Set(plan?.modules ?? ["core"]), isActive: plan?.isActive ?? true,
  });
  const save = useMutation({
    mutationFn: () => {
      const body = {
        ...(plan ? {} : { key: f.key }), nameFa: f.nameFa,
        monthlyAmountRial: tomanInputToRial(f.monthly) ?? "", annualAmountRial: tomanInputToRial(f.annual) ?? "",
        trialDays: f.trialDays, limits: { members: f.members ? f.members : null, branches: f.branches ? f.branches : null },
        modules: [...f.modules], isActive: f.isActive,
      };
      return plan ? api(`/admin/plans/${plan.id}`, { method: "PUT", body }) : api("/admin/plans", { method: "POST", body });
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin"] }); onClose(); },
  });
  const err = save.error as ApiError | null;
  const fe = (k: string) => err?.fields?.[k]?.[0];
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="card space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }} aria-label="ویرایش پلن">
      <h2 className="card-title">{plan ? `ویرایش «${plan.nameFa}»` : "پلن جدید"}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {!plan && <Field label="شناسه (لاتین)" error={fe("key")}><input className="input ltr-nums" dir="ltr" value={f.key} onChange={set("key")} /></Field>}
        <Field label="نام پلن" error={fe("nameFa")}><input className="input" value={f.nameFa} onChange={set("nameFa")} /></Field>
        <Field label="قیمت ماهانه (تومان)" error={fe("monthlyAmountRial")}><input className="input" inputMode="numeric" value={f.monthly} onChange={set("monthly")} /></Field>
        <Field label="قیمت سالانه (تومان)" error={fe("annualAmountRial")}><input className="input" inputMode="numeric" value={f.annual} onChange={set("annual")} /></Field>
        <Field label="روزهای آزمایشی" error={fe("trialDays")}><input className="input" inputMode="numeric" value={f.trialDays} onChange={set("trialDays")} /></Field>
        <Field label="سقف اعضا (خالی = نامحدود)"><input className="input" inputMode="numeric" value={f.members} onChange={set("members")} /></Field>
        <Field label="سقف شعبه (خالی = نامحدود)"><input className="input" inputMode="numeric" value={f.branches} onChange={set("branches")} /></Field>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">ماژول‌ها</legend>
        <div className="flex flex-wrap gap-2">
          {modules.map((m) => (
            <label key={m.key} className="chip cursor-pointer gap-2 py-1.5">
              <input type="checkbox" checked={f.modules.has(m.key)} disabled={m.key === "core"}
                onChange={(e) => { const s = new Set(f.modules); if (e.target.checked) s.add(m.key); else s.delete(m.key); setF({ ...f, modules: s }); }} />
              {m.nameFa}
            </label>
          ))}
        </div>
        {fe("modules") && <p className="field-error">{fe("modules")}</p>}
      </fieldset>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} /> فعال (قابل انتخاب و نمایش در سایت)</label>
      {err && <p role="alert" className="field-error">{err.message}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={save.isPending}>ذخیره</button>
        <button type="button" className="btn-secondary" onClick={onClose}>انصراف</button>
      </div>
    </form>
  );
}
