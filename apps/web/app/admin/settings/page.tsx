"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import type { PlatformSettings } from "@smartgym/validation";
import { api, ApiError } from "@/lib/client/api";
import { ErrorState, LoadingState } from "@/components/states";
import { Field } from "@/components/field";

type Platform = { settings: PlatformSettings; plans: { key: string; nameFa: string }[] };

export default function SettingsPage() {
  const q = useQuery({ queryKey: ["admin", "platform"], queryFn: () => api<Platform>("/public/platform") });
  if (q.isPending) return <LoadingState />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const s = q.data.settings;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">تنظیمات سایت</h1>
        <p className="text-sm text-ink-2">محتوای صفحه‌ی اصلی، اطلاعات تماس و ثبت‌نام باشگاه‌ها.</p>
      </div>
      <SiteForm initial={s.site} />
      <LandingForm initial={s.landing} />
      <SignupForm initial={s.signup} plans={q.data.plans} />
    </div>
  );
}

function useSave<K extends keyof PlatformSettings>(key: K) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: PlatformSettings[K]) => api(`/admin/settings/${key}`, { method: "PUT", body: value }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "platform"] }),
  });
}

function Status({ m }: { m: { isError: boolean; isSuccess: boolean; error: unknown } }) {
  if (m.isError) return <p role="alert" className="field-error">{(m.error as ApiError).message}</p>;
  if (m.isSuccess) return <p className="text-sm text-brand-700" role="status">ذخیره شد.</p>;
  return null;
}

function SiteForm({ initial }: { initial: PlatformSettings["site"] }) {
  const [f, setF] = useState(initial);
  const save = useSave("site");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="card space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(f); }} aria-labelledby="site-t">
      <h2 id="site-t" className="card-title">اطلاعات سایت و تماس</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="نام سایت"><input className="input" value={f.name} onChange={set("name")} /></Field>
        <Field label="شعار"><input className="input" value={f.tagline} onChange={set("tagline")} /></Field>
        <Field label="تلفن پشتیبانی"><input className="input ltr-nums" dir="ltr" value={f.supportPhone} onChange={set("supportPhone")} /></Field>
        <Field label="ایمیل پشتیبانی"><input className="input" dir="ltr" value={f.supportEmail} onChange={set("supportEmail")} /></Field>
        <Field label="اینستاگرام"><input className="input" dir="ltr" value={f.instagram} onChange={set("instagram")} /></Field>
        <Field label="تلگرام"><input className="input" dir="ltr" value={f.telegram} onChange={set("telegram")} /></Field>
      </div>
      <Field label="نشانی"><input className="input" value={f.address} onChange={set("address")} /></Field>
      <Status m={save} />
      <button className="btn-primary" disabled={save.isPending}>ذخیره</button>
    </form>
  );
}

function LandingForm({ initial }: { initial: PlatformSettings["landing"] }) {
  const [f, setF] = useState(initial);
  const save = useSave("landing");
  return (
    <form className="card space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(f); }} aria-labelledby="land-t">
      <h2 id="land-t" className="card-title">صفحه‌ی اصلی (لندینگ)</h2>
      <Field label="تیتر اصلی (بخش سبز را بین دو ستاره بنویسید، مثل *همیشه!*)"><input className="input" value={f.heroTitle} onChange={(e) => setF({ ...f, heroTitle: e.target.value })} /></Field>
      <Field label="توضیح زیر تیتر"><textarea className="input min-h-20" value={f.heroSubtitle} onChange={(e) => setF({ ...f, heroSubtitle: e.target.value })} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="متن دکمه‌ی اصلی"><input className="input" value={f.ctaText} onChange={(e) => setF({ ...f, ctaText: e.target.value })} /></Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={f.showPricing} onChange={(e) => setF({ ...f, showPricing: e.target.checked })} /> نمایش جدول قیمت‌ها</label>
      </div>
      <ListEditor
        title="ویژگی‌ها" items={f.features} onChange={(features) => setF({ ...f, features })} blank={{ title: "", body: "" }}
        render={(it, upd) => (<>
          <input className="input" aria-label="عنوان ویژگی" placeholder="عنوان" value={it.title} onChange={(e) => upd({ ...it, title: e.target.value })} />
          <textarea className="input min-h-16" aria-label="توضیح ویژگی" placeholder="توضیح" value={it.body} onChange={(e) => upd({ ...it, body: e.target.value })} />
        </>)}
      />
      <ListEditor
        title="پرسش‌های متداول" items={f.faq} onChange={(faq) => setF({ ...f, faq })} blank={{ q: "", a: "" }}
        render={(it, upd) => (<>
          <input className="input" aria-label="پرسش" placeholder="پرسش" value={it.q} onChange={(e) => upd({ ...it, q: e.target.value })} />
          <textarea className="input min-h-16" aria-label="پاسخ" placeholder="پاسخ" value={it.a} onChange={(e) => upd({ ...it, a: e.target.value })} />
        </>)}
      />
      <Status m={save} />
      <button className="btn-primary" disabled={save.isPending}>ذخیره</button>
    </form>
  );
}

function ListEditor<T>({ title, items, onChange, blank, render }: {
  title: string; items: T[]; onChange: (v: T[]) => void; blank: T; render: (it: T, upd: (v: T) => void) => React.ReactNode;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">{title}</legend>
      {items.map((it, i) => (
        <div key={i} className="flex gap-2 rounded-xl border border-line p-3">
          <div className="flex-1 space-y-2">{render(it, (v) => onChange(items.map((x, j) => (j === i ? v : x))))}</div>
          <button type="button" className="btn-ghost h-9 px-2 text-err-tx" aria-label="حذف" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 className="size-4" aria-hidden /></button>
        </div>
      ))}
      <button type="button" className="btn-secondary h-8 text-sm" onClick={() => onChange([...items, structuredClone(blank)])}><Plus className="size-4" aria-hidden /> افزودن</button>
    </fieldset>
  );
}

function SignupForm({ initial, plans }: { initial: PlatformSettings["signup"]; plans: Platform["plans"] }) {
  const [f, setF] = useState(initial);
  const save = useSave("signup");
  return (
    <form className="card space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(f); }} aria-labelledby="sign-t">
      <h2 id="sign-t" className="card-title">ثبت‌نام باشگاه</h2>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.allowGymSignup} onChange={(e) => setF({ ...f, allowGymSignup: e.target.checked })} /> ثبت باشگاه جدید از سایت باز باشد</label>
      <Field label="پلن دوره‌ی آزمایشی">
        <select className="input w-auto" value={f.trialPlanKey} onChange={(e) => setF({ ...f, trialPlanKey: e.target.value })}>
          {plans.map((p) => <option key={p.key} value={p.key}>{p.nameFa}</option>)}
        </select>
      </Field>
      <Status m={save} />
      <button className="btn-primary" disabled={save.isPending}>ذخیره</button>
    </form>
  );
}
