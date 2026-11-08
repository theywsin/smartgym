"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { IntegrationsInput } from "@smartgym/validation";
import { api, ApiError } from "@/lib/client/api";
import { ErrorState, LoadingState } from "@/components/states";
import { Field } from "@/components/field";

type Integrations = {
  sms: { provider: "env" | "melipayamak"; apiKeyMasked: string; apiKeySet: boolean; otpBodyId: string; expiryBodyId: string; envProvider: string };
  payment: { onlineEnabled: boolean };
};

export default function IntegrationsPage() {
  const q = useQuery({ queryKey: ["admin", "integrations"], queryFn: () => api<Integrations>("/admin/integrations") });
  if (q.isPending) return <LoadingState />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">پیامک و درگاه پرداخت</h1>
        <p className="text-sm text-ink-2">پنل پیامکی ملی پیامک و درگاه پرداخت آنلاین (بانک سامان) برای کل پلتفرم.</p>
      </div>
      <Form initial={q.data} />
    </div>
  );
}

function Form({ initial }: { initial: Integrations }) {
  const qc = useQueryClient();
  const [provider, setProvider] = useState(initial.sms.provider);
  const [apiKey, setApiKey] = useState("");
  const [otpBodyId, setOtp] = useState(initial.sms.otpBodyId);
  const [expiryBodyId, setExpiry] = useState(initial.sms.expiryBodyId);
  const [onlineEnabled, setOnline] = useState(initial.payment.onlineEnabled);
  const save = useMutation({
    mutationFn: (body: IntegrationsInput) => api<Integrations>("/admin/integrations", { method: "PUT", body }),
    onSuccess: () => { setApiKey(""); void qc.invalidateQueries({ queryKey: ["admin", "integrations"] }); },
  });
  const fieldErr = (k: string) => save.error instanceof ApiError ? save.error.fields?.[k]?.[0] : undefined;
  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); save.mutate({ sms: { provider, melipayamakApiKey: apiKey || undefined, otpBodyId, expiryBodyId }, payment: { onlineEnabled } }); }}>
      <section className="card space-y-4" aria-labelledby="sms-t">
        <h2 id="sms-t" className="card-title">پنل پیامکی</h2>
        <fieldset className="flex flex-wrap gap-4 text-sm">
          <legend className="label mb-2">ارسال پیامک با</legend>
          <label className="flex items-center gap-2"><input type="radio" name="p" checked={provider === "melipayamak"} onChange={() => setProvider("melipayamak")} /> ملی پیامک (تنظیمات همین صفحه)</label>
          <label className="flex items-center gap-2"><input type="radio" name="p" checked={provider === "env"} onChange={() => setProvider("env")} /> تنظیمات سرور {initial.sms.envProvider && <span className="chip text-xs" dir="ltr">{initial.sms.envProvider}</span>}</label>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="کلید API ملی پیامک" hint={initial.sms.apiKeySet ? `ذخیره شده: ${initial.sms.apiKeyMasked}. برای تغییر، کلید جدید بنویسید.` : "از پنل ملی پیامک، بخش وب‌سرویس کپی کنید."}>
            <input className="input" dir="ltr" type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={initial.sms.apiKeySet ? initial.sms.apiKeyMasked : ""} />
          </Field>
          <Field label="کد الگوی کد ورود (bodyId)" error={fieldErr("otpBodyId")} hint="متن الگو یک متغیر دارد: {0} = کد">
            <input className="input ltr-nums" dir="ltr" inputMode="numeric" value={otpBodyId} onChange={(e) => setOtp(e.target.value)} />
          </Field>
          <Field label="کد الگوی یادآوری تمدید" error={fieldErr("expiryBodyId")} hint="متغیرها: {0} نام، {1} باشگاه، {2} روز باقی‌مانده">
            <input className="input ltr-nums" dir="ltr" inputMode="numeric" value={expiryBodyId} onChange={(e) => setExpiry(e.target.value)} />
          </Field>
        </div>
        <p className="text-xs text-ink-3">کلید رمزنگاری‌شده در پایگاه داده نگه‌داری می‌شود و هرگز به مرورگر برنمی‌گردد. تغییرات حداکثر ظرف ۳۰ ثانیه اعمال می‌شود.</p>
      </section>
      <section className="card space-y-3" aria-labelledby="pay-t">
        <h2 id="pay-t" className="card-title">درگاه پرداخت آنلاین (سامان)</h2>
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input type="checkbox" className="size-4" checked={onlineEnabled} onChange={(e) => setOnline(e.target.checked)} />
          پرداخت آنلاین شهریه و بدهی برای ورزشکاران فعال باشد
        </label>
        <p className="text-xs text-ink-3">شماره ترمینال سامان هر باشگاه جداگانه است: در صفحه‌ی جزئیات هر باشگاه (تب باشگاه‌ها) یا توسط خود مدیر باشگاه در تنظیمات پنلش ثبت می‌شود. بازگشت از درگاه روی نشانی سایت (APP_URL) تنظیم است.</p>
      </section>
      {save.isError && <p role="alert" className="field-error">{(save.error as ApiError).message}</p>}
      {save.isSuccess && <p role="status" className="text-sm text-brand-700">ذخیره شد.</p>}
      <button className="btn-primary" disabled={save.isPending}>ذخیره</button>
    </form>
  );
}
