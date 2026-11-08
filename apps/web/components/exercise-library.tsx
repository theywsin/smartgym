"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { EXERCISE_LIBRARY, EXERCISE_MUSCLES, exerciseFrames, type LibraryExercise } from "@smartgym/shared";

/** Start/end position frames shown alternately, which reads as the movement animation. */
export function ExerciseAnim({ id, className = "" }: { id: string; className?: string }) {
  const [f, setF] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setF((x) => 1 - x), 900);
    return () => clearInterval(t);
  }, []);
  const frames = exerciseFrames(id);
  return (
    <span className={`relative block overflow-hidden bg-white ${className}`}>
      {frames.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt="" loading="lazy" className={`absolute inset-0 size-full object-contain transition-opacity duration-300 ${f === i ? "opacity-100" : "opacity-0"}`} />
      ))}
    </span>
  );
}

/** Searchable picker over the built-in exercise library. */
export function ExercisePicker({ onPick, onClose }: { onPick: (e: LibraryExercise) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<string>("");
  const [added, setAdded] = useState<string[]>([]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return EXERCISE_LIBRARY.filter((e) => (!muscle || e.muscle === muscle) && (!s || e.name.includes(s) || e.nameEn.toLowerCase().includes(s) || e.equipment.includes(s)));
  }, [q, muscle]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" role="dialog" aria-modal="true" aria-label="کتابخانه‌ی حرکات" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-t-2xl bg-surface shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-line-2 p-4">
          <h2 className="text-lg font-bold">کتابخانه‌ی حرکات</h2>
          <span className="text-sm text-ink-2">{EXERCISE_LIBRARY.length.toLocaleString("fa-IR")} حرکت</span>
          <button type="button" className="btn-ghost ms-auto px-2" aria-label="بستن" onClick={onClose}><X className="size-5" aria-hidden /></button>
        </div>
        <div className="space-y-3 border-b border-line-2 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-ink-2" aria-hidden />
            <input autoFocus className="input ps-9" placeholder="جستجوی حرکت (فارسی یا انگلیسی)" aria-label="جستجوی حرکت" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="عضله">
            {["", ...EXERCISE_MUSCLES].map((m) => (
              <button key={m || "all"} type="button" aria-pressed={muscle === m} onClick={() => setMuscle(m)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${muscle === m ? "border-brand-600 bg-brand-600 text-white" : "border-line-2 text-ink-2 hover:bg-canvas"}`}>{m || "همه"}</button>
            ))}
          </div>
        </div>
        <div className="grid min-h-0 flex-1 auto-rows-max content-start grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((e) => {
            const n = added.filter((x) => x === e.id).length;
            return (
              <button key={e.id} type="button" onClick={() => { onPick(e); setAdded((a) => [...a, e.id]); }}
                className="group overflow-hidden rounded-xl border border-line-2 text-start transition hover:border-brand-500 hover:shadow-md">
                <ExerciseAnim id={e.id} className="aspect-[4/3] w-full" />
                <span className="block p-2">
                  <span className="block text-sm font-bold">{e.name}</span>
                  <span className="block text-xs text-ink-2">{e.muscle} · {e.equipment}</span>
                  <span className={`mt-1 block text-xs font-semibold ${n ? "text-brand-700" : "text-ink-3 group-hover:text-brand-700"}`}>{n ? `✓ اضافه شد${n > 1 ? ` (${n.toLocaleString("fa-IR")})` : ""}` : "+ افزودن به این روز"}</span>
                </span>
              </button>
            );
          })}
          {list.length === 0 && <p className="col-span-full py-10 text-center text-ink-2">حرکتی پیدا نشد.</p>}
        </div>
        <div className="flex items-center gap-3 border-t border-line-2 p-3">
          <p className="text-xs text-ink-3">تصاویر: free-exercise-db (مالکیت عمومی)</p>
          <button type="button" className="btn-primary ms-auto" onClick={onClose}>تمام</button>
        </div>
      </div>
    </div>
  );
}
