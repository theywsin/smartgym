"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";

/** Upload an image (admin only) and get its /uploads/... URL back. Shows a preview of the current value. */
export function ImageUpload({ value, onChange, label, aspect = "aspect-video", endpoint = "/admin/uploads" }: { value: string; onChange: (url: string) => void; label: string; aspect?: string; endpoint?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-2">
      <span className="label">{label}</span>
      <div className="flex flex-wrap items-start gap-3">
        <div className={`relative flex w-48 items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-canvas ${aspect}`}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded image
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : <ImagePlus className="size-6 text-ink-3" aria-hidden />}
          {value && <button type="button" className="absolute top-1 left-1 rounded-full bg-white/90 p-1 shadow" aria-label="حذف تصویر" onClick={() => onChange("")}><X className="size-3.5" /></button>}
        </div>
        <div className="space-y-1">
          <button type="button" className="btn-secondary h-9 text-sm" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}بارگذاری تصویر
          </button>
          <p className="text-xs text-ink-3">PNG، JPG، WEBP یا GIF تا ۵ مگابایت</p>
          {error && <p role="alert" className="field-error">{error}</p>}
        </div>
      </div>
      <input
        ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" aria-label={label}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true); setError("");
          try {
            const r = await api<{ url: string }>(endpoint, { method: "POST", file });
            onChange(r.url);
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "بارگذاری انجام نشد.");
          } finally { setBusy(false); }
        }}
      />
    </div>
  );
}
