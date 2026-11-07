"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { useCan } from "@/lib/client/me";
import { fa, toman, tomanInputToRial } from "@/lib/client/format";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";

type Plan = {
  id: string; name: string; description: string | null; durationDays: number; priceAmountRial: string;
  entryLimit: number | null; allowedBranchIds: string[]; isActive: boolean;
};
type Branch = { id: string; name: string };
type Draft = { name: string; description: string; durationDays: string; priceToman: string; entryLimit: string; allowedBranchIds: string[] };

const EMPTY: Draft = { name: "", description: "", durationDays: "30", priceToman: "", entryLimit: "", allowedBranchIds: [] };
const toLatin = (v: string) => v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).trim();

export default function PlansPage() {
  const qc = useQueryClient();
  const canManage = useCan("plans.manage");
  const plans = useQuery({ queryKey: ["plans", "all"], queryFn: () => api<Plan[]>("/memberships/plans?all=1") });
  const branches = useQuery({ queryKey: ["branches"], queryFn: () => api<Branch[]>("/branches") });
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      editing === "new"
        ? api("/memberships/plans", { method: "POST", body })
        : api(`/memberships/plans/${editing}`, { method: "PATCH", body }),
    onSuccess: () => {
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (e) => {
      if (e instanceof ApiError && e.fields) setErrors(Object.fromEntries(Object.entries(e.fields).map(([k, v]) => [k, v[0] ?? ""])));
    },
  });
  const toggle = useMutation({
    mutationFn: (p: Plan) => api(`/memberships/plans/${p.id}`, { method: "PATCH", body: { isActive: !p.isActive } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["plans"] }),
  });

  const open = (p?: Plan) => {
    setErrors({});
    save.reset();
    setEditing(p ? p.id : "new");
    setDraft(
      p
        ? {
            name: p.name, description: p.description ?? "", durationDays: String(p.durationDays),
            priceToman: (BigInt(p.priceAmountRial) / 10n).toString(), entryLimit: p.entryLimit ? String(p.entryLimit) : "",
            allowedBranchIds: p.allowedBranchIds,
          }
        : EMPTY
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const price = tomanInputToRial(draft.priceToman);
    const days = Number(toLatin(draft.durationDays));
    const limit = toLatin(draft.entryLimit);
    if (!draft.name.trim()) errs.name = "نام پلن را وارد کنید";
    if (!Number.isInteger(days) || days < 1) errs.durationDays = "مدت را به روز وارد کنید";
    if (price === null) errs.priceAmountRial = "مبلغ را به عدد و به تومان وارد کنید";
    if (limit && (!/^\d+$/.test(limit) || Number(limit) < 1)) errs.entryLimit = "تعداد جلسات باید عدد مثبت باشد";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    save.mutate({
      name: draft.name,
      description: draft.description,
      durationDays: days,
      priceAmountRial: price,
      entryLimit: limit ? Number(limit) : null,
      allowedBranchIds: draft.allowedBranchIds,
    });
  };

  const branchCount = branches.data?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">پلن‌های عضویت</h1>
          <p className="text-sm text-ink-2">تغییر قیمت یا شرایط پلن فقط روی فروش‌های بعدی اثر دارد؛ اشتراک‌های فروخته‌شده تغییر نمی‌کنند.</p>
        </div>
        {canManage && editing === null && (
          <button type="button" className="btn-primary" onClick={() => open()}>
            <Plus className="size-4" aria-hidden />
            پلن جدید
          </button>
        )}
      </div>

      {editing !== null && (
        <form className="card space-y-4" noValidate onSubmit={submit} aria-labelledby="plan-form-title">
          <h2 id="plan-form-title" className="card-title">{editing === "new" ? "پلن جدید" : "ویرایش پلن"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="p-name" label="نام پلن" error={errors.name}>
              <input id="p-name" className="input" placeholder="مثلاً ماهانه" value={draft.name} aria-invalid={!!errors.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field id="p-price" label="مبلغ (تومان)" error={errors.priceAmountRial}>
              <input id="p-price" className="input ltr-nums text-left" inputMode="numeric" placeholder="2500000" value={draft.priceToman} aria-invalid={!!errors.priceAmountRial} onChange={(e) => setDraft({ ...draft, priceToman: e.target.value })} />
            </Field>
            <Field id="p-days" label="مدت (روز)" error={errors.durationDays}>
              <input id="p-days" className="input ltr-nums text-left" inputMode="numeric" value={draft.durationDays} aria-invalid={!!errors.durationDays} onChange={(e) => setDraft({ ...draft, durationDays: e.target.value })} />
            </Field>
            <Field id="p-limit" label="تعداد جلسات (خالی = نامحدود)" error={errors.entryLimit}>
              <input id="p-limit" className="input ltr-nums text-left" inputMode="numeric" value={draft.entryLimit} aria-invalid={!!errors.entryLimit} onChange={(e) => setDraft({ ...draft, entryLimit: e.target.value })} />
            </Field>
          </div>
          <Field id="p-desc" label="توضیح">
            <input id="p-desc" className="input" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </Field>
          {branchCount > 1 && (
            <fieldset>
              <legend className="label">شعبه‌های مجاز (هیچ‌کدام = همه شعب)</legend>
              <div className="flex flex-wrap gap-2">
                {branches.data?.map((b) => (
                  <label key={b.id} className="chip cursor-pointer has-[:checked]:border-brand-200 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700">
                    <input
                      type="checkbox"
                      className="accent-brand-600"
                      checked={draft.allowedBranchIds.includes(b.id)}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          allowedBranchIds: e.target.checked ? [...draft.allowedBranchIds, b.id] : draft.allowedBranchIds.filter((x) => x !== b.id),
                        })
                      }
                    />
                    {b.name}
                  </label>
                ))}
              </div>
              {errors.allowedBranchIds && <p className="field-error">{errors.allowedBranchIds}</p>}
            </fieldset>
          )}
          {save.error && !(save.error instanceof ApiError && save.error.fields) && (
            <p role="alert" className="field-error">{save.error instanceof ApiError ? save.error.message : "خطا در ذخیره"}</p>
          )}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={save.isPending}>
              {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              ذخیره
            </button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>انصراف</button>
          </div>
        </form>
      )}

      {plans.isPending && <LoadingState />}
      {plans.isError && <ErrorState error={plans.error} onRetry={() => plans.refetch()} />}
      {plans.data?.length === 0 && editing === null && (
        <div className="card">
          <EmptyState
            title="هنوز پلنی تعریف نشده است"
            hint="برای فروش اشتراک، ابتدا پلن‌هایی مثل ماهانه، سه‌ماهه یا ۱۲ جلسه‌ای تعریف کنید."
            action={canManage ? <button type="button" className="btn-primary" onClick={() => open()}>تعریف اولین پلن</button> : undefined}
          />
        </div>
      )}
      {plans.data && plans.data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.data.map((p) => (
            <article key={p.id} className={`card flex flex-col gap-3 ${p.isActive ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="card-title">{p.name}</h2>
                <span className={p.isActive ? "chip-brand" : "chip"}>{p.isActive ? "فعال" : "غیرفعال"}</span>
              </div>
              <p className="text-2xl font-extrabold">{toman(p.priceAmountRial)}</p>
              <p className="text-sm text-ink-2">
                {fa(p.durationDays)} روز، {p.entryLimit === null ? "جلسات نامحدود" : `${fa(p.entryLimit)} جلسه`}
                {p.allowedBranchIds.length > 0 && `، ${p.allowedBranchIds.map((id) => branches.data?.find((b) => b.id === id)?.name ?? "").join("، ")}`}
              </p>
              {p.description && <p className="text-sm text-ink-2">{p.description}</p>}
              {canManage && (
                <div className="mt-auto flex gap-2 pt-2">
                  <button type="button" className="btn-secondary h-8 px-3 text-xs" onClick={() => open(p)}>ویرایش</button>
                  <button type="button" className="btn-ghost h-8 px-3 text-xs" disabled={toggle.isPending} onClick={() => toggle.mutate(p)}>
                    {p.isActive ? "غیرفعال کردن" : "فعال کردن"}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
