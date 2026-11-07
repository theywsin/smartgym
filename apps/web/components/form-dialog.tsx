"use client";

import { useEffect, useRef, useState } from "react";

export type DialogField = {
  name: string;
  label: string;
  kind?: "text" | "number";
  defaultValue?: string;
  hint?: string;
  required?: boolean;
};

export type DialogRequest = {
  title: string;
  description?: string;
  fields: DialogField[];
  confirmLabel?: string;
  danger?: boolean;
  /** Return an error string to keep the dialog open, or nothing to close it. */
  onSubmit: (values: Record<string, string>) => string | void;
};

const toLatin = (s: string) => s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٬,]/g, "").trim();

/** Accessible modal form replacing window.prompt(). Render once; open it by setting `request`. */
export function FormDialog({ request, onClose }: { request: DialogRequest | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (request && !d.open) { setError(null); d.showModal(); }
    if (!request && d.open) d.close();
  }, [request]);

  return (
    <dialog ref={ref} onClose={onClose} className="m-auto w-[min(440px,calc(100vw-32px))] rounded-2xl border border-line p-0 backdrop:bg-black/40">
      {request && (
        <form
          method="dialog"
          className="space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const values: Record<string, string> = {};
            for (const field of request.fields) {
              const raw = String(f.get(field.name) ?? "");
              values[field.name] = field.kind === "number" ? toLatin(raw) : raw.trim();
              if ((field.required ?? true) && !values[field.name]) return setError(`«${field.label}» را وارد کنید.`);
              if (field.kind === "number" && values[field.name] && !/^\d+$/.test(values[field.name]!)) return setError(`«${field.label}» باید عدد باشد.`);
            }
            const err = request.onSubmit(values);
            if (err) setError(err); else onClose();
          }}
        >
          <h2 className="text-lg font-extrabold">{request.title}</h2>
          {request.description && <p className="text-sm text-ink-2">{request.description}</p>}
          {request.fields.map((field, i) => (
            <label key={field.name} className="block space-y-1">
              <span className="text-sm font-semibold">{field.label}</span>
              <input
                name={field.name}
                className="input"
                defaultValue={field.defaultValue}
                inputMode={field.kind === "number" ? "numeric" : undefined}
                autoFocus={i === 0}
                autoComplete="off"
              />
              {field.hint && <span className="block text-xs text-ink-2">{field.hint}</span>}
            </label>
          ))}
          {error && <p role="alert" className="field-error">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>انصراف</button>
            <button type="submit" className={request.danger ? "btn-primary bg-err-tx hover:bg-err-tx/90" : "btn-primary"}>{request.confirmLabel ?? "تأیید"}</button>
          </div>
        </form>
      )}
    </dialog>
  );
}
