"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { ErrorState, LoadingState } from "@/components/states";
import { SetPasswordCard } from "@/components/set-password";

type Settings = { terminalId: string | null };

export default function SettingsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["settings-payments"], queryFn: () => api<Settings>("/settings/payments") });
  const [terminal, setTerminal] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (q.data) setTerminal(q.data.terminalId ?? ""); }, [q.data]);
  const save = useMutation({
    mutationFn: () => api<Settings>("/settings/payments", { method: "PUT", body: { terminalId: terminal.trim() || null } }),
    onSuccess: (d) => { qc.setQueryData(["settings-payments"], d); setSaved(true); },
  });
  const err = save.error as ApiError | null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-extrabold">تنظیمات</h1>
      {q.isLoading ? <LoadingState /> : q.error ? <ErrorState error={q.error} /> : (
        <section className="card max-w-xl space-y-4" aria-labelledby="pay-title">
          <div>
            <h2 id="pay-title" className="card-title">پرداخت آنلاین (بانک سامان)</h2>
            <p className="mt-1 text-sm text-ink-2">با وارد کردن شماره ترمینال درگاه اینترنتی سامان، می‌توانید برای بدهی اعضا لینک پرداخت بسازید. مبلغ مستقیم به حساب باشگاه واریز می‌شود.</p>
          </div>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setSaved(false); save.mutate(); }}>
            <div>
              <label htmlFor="terminal" className="label">شماره ترمینال</label>
              <input id="terminal" inputMode="numeric" className="input ltr-nums text-left" value={terminal}
                onChange={(e) => { setTerminal(e.target.value); setSaved(false); }} placeholder="مثلاً 13000000" aria-describedby="terminal-help" />
              <p id="terminal-help" className="mt-1 text-xs text-ink-3">برای غیرفعال کردن پرداخت آنلاین خالی بگذارید.</p>
              {err?.fields?.terminalId && <p className="field-error">{err.fields.terminalId[0]}</p>}
            </div>
            {err && !err.fields && <p role="alert" className="field-error">{err.message}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-primary" disabled={save.isPending}>
                {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}ذخیره
              </button>
              {saved && <span role="status" className="text-sm text-brand-700">ذخیره شد.</span>}
            </div>
          </form>
        </section>
      )}
      <ReminderSettings />
      <SetPasswordCard />
    </div>
  );
}

type Reminder = { enabled: boolean; daysBefore: number; smsConfigured: boolean };

function ReminderSettings() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["settings-reminders"], queryFn: () => api<Reminder>("/settings/reminders") });
  const [draft, setDraft] = useState<{ enabled: boolean; days: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const cur = draft ?? (q.data ? { enabled: q.data.enabled, days: String(q.data.daysBefore) } : null);
  const save = useMutation({
    mutationFn: () => api<Reminder>("/settings/reminders", { method: "PUT", body: { enabled: cur!.enabled, daysBefore: Number(cur!.days.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))) } }),
    onSuccess: (d) => { qc.setQueryData(["settings-reminders"], d); setDraft(null); setSaved(true); },
  });
  const err = save.error as ApiError | null;
  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} />;
  return (
    <section className="card max-w-xl space-y-4" aria-labelledby="rem-title">
      <div>
        <h2 id="rem-title" className="card-title">یادآور پیامکی پایان اشتراک</h2>
        <p className="mt-1 text-sm text-ink-2">چند روز پیش از پایان اشتراک، یک پیامک یادآوری برای عضو فرستاده می‌شود (فقط یک بار برای هر دوره، بین ساعت ۹ تا ۲۱). اعضایی که تمدید کرده‌اند پیامک نمی‌گیرند.</p>
        {!q.data!.smsConfigured && <p className="mt-2 rounded-lg bg-warn-bg p-2 text-xs text-warn-tx">قالب پیامک یادآوری هنوز در سرور تنظیم نشده است؛ تا آن زمان پیامکی ارسال نمی‌شود.</p>}
      </div>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setSaved(false); save.mutate(); }}>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={cur!.enabled} onChange={(e) => { setDraft({ ...cur!, enabled: e.target.checked }); setSaved(false); }} />
          ارسال یادآور فعال باشد
        </label>
        <div>
          <label htmlFor="days" className="label">چند روز قبل از پایان</label>
          <input id="days" inputMode="numeric" className="input w-24 ltr-nums" value={cur!.days} disabled={!cur!.enabled}
            onChange={(e) => { setDraft({ ...cur!, days: e.target.value }); setSaved(false); }} />
          {err?.fields?.daysBefore && <p className="field-error">{err.fields.daysBefore[0]}</p>}
        </div>
        {err && !err.fields && <p role="alert" className="field-error">{err.message}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={save.isPending}>ذخیره</button>
          {saved && <span role="status" className="text-sm text-brand-700">ذخیره شد.</span>}
        </div>
      </form>
    </section>
  );
}
