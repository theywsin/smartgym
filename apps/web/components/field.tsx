"use client";

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-ink-3">{hint}</span>}
      {error && <span className="field-error block">{error}</span>}
    </label>
  );
}
