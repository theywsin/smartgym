"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { ErrorState, LoadingState } from "@/components/states";

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
    </div>
  );
}
