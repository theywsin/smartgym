"use client";

import { AlertTriangle, Inbox, Loader2, Lock, WifiOff } from "lucide-react";
import { ApiError } from "@/lib/client/api";

/** Shared loading / empty / error / unauthorized / offline states (brief §14). */
export function LoadingState({ label = "در حال بارگذاری…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-ink-2">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <div className="mb-1 flex size-12 items-center justify-center rounded-full bg-line-2 text-ink-3">
        <Inbox className="size-6" aria-hidden />
      </div>
      <p className="font-bold">{title}</p>
      {hint && <p className="max-w-sm text-sm text-ink-2">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const e = error instanceof ApiError ? error : null;
  if (e?.code === "OFFLINE") {
    return (
      <Banner icon={<WifiOff className="size-5" aria-hidden />} title="اتصال برقرار نیست" text={e.message} onRetry={onRetry} />
    );
  }
  if (e?.status === 403) {
    return <Banner icon={<Lock className="size-5" aria-hidden />} title="دسترسی ندارید" text={e.message} />;
  }
  return (
    <Banner
      icon={<AlertTriangle className="size-5" aria-hidden />}
      title="خطا در دریافت اطلاعات"
      text={e?.message ?? "خطای غیرمنتظره‌ای رخ داد."}
      onRetry={onRetry}
    />
  );
}

function Banner({ icon, title, text, onRetry }: { icon: React.ReactNode; title: string; text: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-[#fecaca] bg-err-bg p-4 text-err-tx">
      {icon}
      <div className="flex-1">
        <p className="font-bold">{title}</p>
        <p className="text-sm">{text}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn-secondary h-8 px-3 text-xs" onClick={onRetry}>
          تلاش دوباره
        </button>
      )}
    </div>
  );
}
