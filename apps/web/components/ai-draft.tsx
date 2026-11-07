"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";

type Exercise = { name: string; sets: number; reps: string; restSeconds?: number; note?: string };
export type AiProgram = { title: string; goal?: string; notes?: string; days: { title: string; exercises: Exercise[] }[] };

const toLatin = (s: string) => s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).trim();

/** Asks the AI assistant for a draft; the coach reviews and edits it before saving. */
export function AiDraftPanel({ memberId, onDraft }: { memberId: string; onDraft: (p: AiProgram) => void }) {
  const run = useMutation({
    mutationFn: (body: Record<string, unknown>) => api<AiProgram>(`/members/${memberId}/programs/ai-draft`, { method: "POST", body }),
    onSuccess: onDraft,
  });
  const err = run.error as ApiError | null;
  return (
    <details className="card">
      <summary className="flex cursor-pointer items-center gap-2 font-bold"><Sparkles className="size-4 text-brand" aria-hidden />پیش‌نویس با دستیار هوش مصنوعی</summary>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const s = (k: string) => String(f.get(k) ?? "").trim();
          run.mutate({
            goal: s("goal"), level: s("level"), daysPerWeek: Number(toLatin(s("days"))) || 3,
            ...(s("sex") && { sex: s("sex") }), ...(s("equipment") && { equipment: s("equipment") }), ...(s("limitations") && { limitations: s("limitations") }),
          });
        }}
      >
        <div className="sm:col-span-2"><label htmlFor="ai-goal" className="label">هدف شاگرد</label><input id="ai-goal" name="goal" className="input" placeholder="مثلاً کاهش وزن و افزایش استقامت" /></div>
        <div><label htmlFor="ai-level" className="label">سطح</label><select id="ai-level" name="level" className="input" defaultValue="BEGINNER"><option value="BEGINNER">مبتدی</option><option value="INTERMEDIATE">متوسط</option><option value="ADVANCED">پیشرفته</option></select></div>
        <div><label htmlFor="ai-days" className="label">روز تمرین در هفته</label><input id="ai-days" name="days" inputMode="numeric" className="input ltr-nums" defaultValue="3" /></div>
        <div><label htmlFor="ai-sex" className="label">جنسیت (اختیاری)</label><select id="ai-sex" name="sex" className="input" defaultValue=""><option value="">نامشخص</option><option value="MALE">مرد</option><option value="FEMALE">زن</option></select></div>
        <div><label htmlFor="ai-eq" className="label">تجهیزات (اختیاری)</label><input id="ai-eq" name="equipment" className="input" placeholder="باشگاه کامل" /></div>
        <div className="sm:col-span-2"><label htmlFor="ai-lim" className="label">آسیب یا محدودیت (اختیاری)</label><input id="ai-lim" name="limitations" className="input" placeholder="مثلاً درد کمر" /></div>
        <p className="text-xs text-ink-3 sm:col-span-2">نام و شماره شاگرد برای سرویس هوش مصنوعی فرستاده نمی‌شود. پیش‌نویس جای برنامه فعلی فرم را می‌گیرد و تا ذخیره نکنید ثبت نمی‌شود.</p>
        {err && <p role="alert" className="field-error sm:col-span-2">{err.fields ? Object.values(err.fields)[0]?.[0] ?? err.message : err.message}</p>}
        <div className="sm:col-span-2"><button type="submit" className="btn-secondary" disabled={run.isPending}>{run.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}ساخت پیش‌نویس</button></div>
      </form>
    </details>
  );
}
