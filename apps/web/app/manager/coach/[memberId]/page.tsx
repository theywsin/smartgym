"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { toPersianDigits } from "@smartgym/shared";
import { api, ApiError } from "@/lib/client/api";
import { useCan } from "@/lib/client/me";
import { jdate } from "@/lib/client/format";
import { ErrorState, LoadingState } from "@/components/states";
import { AiDraftPanel } from "@/components/ai-draft";
import { ImageUpload } from "@/components/image-upload";
import { ExerciseAnim, ExercisePicker } from "@/components/exercise-library";

type Exercise = { name: string; sets: number; reps: string; restSeconds?: number; note?: string; weightKg?: number; muscle?: string; imageUrl?: string; videoUrl?: string; tips?: string; libraryId?: string };
type Day = { title: string; weekday?: number; exercises: Exercise[] };
const WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
type DraftEx = { name: string; sets: string; reps: string; rest: string; note: string; weight: string; muscle: string; imageUrl: string; videoUrl: string; tips: string; libraryId: string };
type Program = { id: string; title: string; goal: string | null; notes: string | null; days: Day[]; isActive: boolean; createdAt: string; updatedAt: string; archivedAt: string | null };
type Member = { id: string; firstName: string; lastName: string; code: number };
type Draft = { title: string; goal: string; notes: string; days: { title: string; weekday: string; exercises: DraftEx[] }[] };

const blankExercise = (): DraftEx => ({ name: "", sets: "3", reps: "10", rest: "90", note: "", weight: "", muscle: "", imageUrl: "", videoUrl: "", tips: "", libraryId: "" });
const toLatin = (s: string) => s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).trim();

function toDraft(p?: Program): Draft {
  if (!p) return { title: "", goal: "", notes: "", days: [{ title: "روز ۱", weekday: "", exercises: [blankExercise()] }] };
  return {
    title: p.title, goal: p.goal ?? "", notes: p.notes ?? "",
    days: p.days.map((d) => ({
      title: d.title, weekday: d.weekday != null ? String(d.weekday) : "",
      exercises: d.exercises.map((e) => ({
        name: e.name, sets: String(e.sets), reps: e.reps, rest: e.restSeconds != null ? String(e.restSeconds) : "", note: e.note ?? "",
        weight: e.weightKg != null ? String(e.weightKg) : "", muscle: e.muscle ?? "", imageUrl: e.imageUrl ?? "", videoUrl: e.videoUrl ?? "", tips: e.tips ?? "", libraryId: e.libraryId ?? "",
      })),
    })),
  };
}

function fromDraft(d: Draft) {
  return {
    title: d.title, goal: d.goal || undefined, notes: d.notes || undefined,
    days: d.days.map((day) => ({
      title: day.title,
      ...(day.weekday !== "" && { weekday: Number(day.weekday) }),
      exercises: day.exercises.map((e) => ({
        name: e.name, sets: Number(toLatin(e.sets)) || 0, reps: toLatin(e.reps),
        ...(toLatin(e.rest) !== "" && { restSeconds: Number(toLatin(e.rest)) }), note: e.note || undefined,
        ...(toLatin(e.weight) !== "" && { weightKg: Number(toLatin(e.weight).replace(/[/٫]/, ".")) }),
        muscle: e.muscle || undefined, imageUrl: e.imageUrl || undefined, videoUrl: e.videoUrl || undefined, tips: e.tips || undefined, libraryId: e.libraryId || undefined,
      })),
    })),
  };
}

export default function AthleteProgramPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const qc = useQueryClient();
  const canManage = useCan("workouts.manage");
  const member = useQuery({ queryKey: ["member", memberId], queryFn: () => api<Member>(`/members/${memberId}`) });
  const programs = useQuery({ queryKey: ["programs", memberId], queryFn: () => api<Program[]>(`/members/${memberId}/programs`) });
  const active = programs.data?.find((p) => p.isActive);
  const history = programs.data?.filter((p) => !p.isActive) ?? [];
  const [mode, setMode] = useState<"view" | "new" | "edit">("view");
  const [draft, setDraft] = useState<Draft>(toDraft());
  const [picker, setPicker] = useState<number | null>(null);

  const save = useMutation({
    mutationFn: () =>
      mode === "edit" && active
        ? api(`/workout-programs/${active.id}`, { method: "PUT", body: fromDraft(draft) })
        : api(`/members/${memberId}/programs`, { method: "POST", body: fromDraft(draft) }),
    onSuccess: () => { setMode("view"); void qc.invalidateQueries({ queryKey: ["programs", memberId] }); void qc.invalidateQueries({ queryKey: ["my-athletes"] }); },
  });
  const err = save.error as ApiError | null;

  if (member.isLoading || programs.isLoading) return <LoadingState />;
  if (member.error) return <ErrorState error={member.error} />;
  if (programs.error) return <ErrorState error={programs.error} />;
  const m = member.data!;

  const setDay = (i: number, f: (d: Draft["days"][number]) => Draft["days"][number]) => setDraft((s) => ({ ...s, days: s.days.map((d, j) => (j === i ? f(d) : d)) }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/manager/coach" className="btn-ghost -mr-3 mb-1 h-8 px-3 text-xs"><ArrowRight className="size-3.5" aria-hidden />شاگردان من</Link>
        <h1 className="text-xl font-extrabold">{m.firstName} {m.lastName} <span className="text-sm font-normal text-ink-3">#{toPersianDigits(m.code)}</span></h1>
      </div>

      {mode === "view" ? (
        <>
          {active ? <ProgramView p={active} /> : <div className="card text-sm text-ink-2">این شاگرد هنوز برنامه‌ی تمرینی ندارد.</div>}
          <Sessions memberId={memberId} />
          {canManage && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={() => { setDraft(toDraft()); setMode("new"); }}><Plus className="size-4" aria-hidden />برنامه‌ی جدید</button>
              {active && <button type="button" className="btn-secondary" onClick={() => { setDraft(toDraft(active)); setMode("edit"); }}>ویرایش برنامه‌ی فعلی</button>}
              {active && <button type="button" className="btn-ghost" onClick={() => { setDraft({ ...toDraft(active), title: `${active.title} (نسخه‌ی جدید)` }); setMode("new"); }}><Copy className="size-4" aria-hidden />برنامه‌ی جدید از روی فعلی</button>}
            </div>
          )}
          {history.length > 0 && (
            <details className="card">
              <summary className="cursor-pointer font-bold">برنامه‌های قبلی ({toPersianDigits(history.length)})</summary>
              <div className="mt-4 space-y-4">{history.map((p) => <ProgramView key={p.id} p={p} />)}</div>
            </details>
          )}
        </>
      ) : (
        <>
        {canManage && <AiDraftPanel memberId={memberId} onDraft={(p) => setDraft(toDraft({ ...p, goal: p.goal ?? null, notes: p.notes ?? null } as Program))} />}
        <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <section className="card grid gap-3 sm:grid-cols-2">
            <div><label htmlFor="ptitle" className="label">عنوان برنامه</label><input id="ptitle" className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
            <div><label htmlFor="pgoal" className="label">هدف</label><input id="pgoal" className="input" placeholder="مثلاً عضله‌سازی، کاهش وزن" value={draft.goal} onChange={(e) => setDraft({ ...draft, goal: e.target.value })} /></div>
            <div className="sm:col-span-2"><label htmlFor="pnotes" className="label">توضیحات برای شاگرد</label><textarea id="pnotes" className="input min-h-20" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></div>
          </section>
          {draft.days.map((day, i) => (
            <section key={i} className="card space-y-3" aria-label={day.title || `روز ${i + 1}`}>
              <div className="flex items-center gap-2">
                <input aria-label="عنوان روز" className="input font-bold" value={day.title} onChange={(e) => setDay(i, (d) => ({ ...d, title: e.target.value }))} />
                <select aria-label="روز هفته" className="input w-36" value={day.weekday} onChange={(e) => setDay(i, (d) => ({ ...d, weekday: e.target.value }))}>
                  <option value="">بدون روز ثابت</option>
                  {WEEKDAYS.map((w, k) => <option key={k} value={k} disabled={draft.days.some((x, j) => j !== i && x.weekday === String(k))}>{w}</option>)}
                </select>
                {draft.days.length > 1 && <button type="button" className="btn-ghost px-2 text-err-tx" aria-label="حذف روز" onClick={() => setDraft({ ...draft, days: draft.days.filter((_, j) => j !== i) })}><Trash2 className="size-4" aria-hidden /></button>}
              </div>
              <div className="space-y-2">
                <div className="hidden grid-cols-[1fr_4rem_5rem_5rem_5rem_2rem] gap-2 text-xs text-ink-2 sm:grid"><span>حرکت</span><span>ست</span><span>تکرار</span><span>استراحت (ثانیه)</span><span>وزنه (کیلو)</span><span /></div>
                {day.exercises.map((ex, k) => {
                  const setEx = (patch: Partial<typeof ex>) => setDay(i, (d) => ({ ...d, exercises: d.exercises.map((x, j) => (j === k ? { ...x, ...patch } : x)) }));
                  return (
                    <div key={k} className="space-y-2 rounded-xl border border-line-2 p-2">
                    <div className="grid grid-cols-[1fr_4rem_5rem_5rem_5rem_2rem] gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                      {ex.libraryId && <ExerciseAnim id={ex.libraryId} className="size-10 shrink-0 rounded-lg border border-line-2" />}
                      <input aria-label="نام حرکت" className="input" placeholder="مثلاً پرس سینه" value={ex.name} onChange={(e) => setEx({ name: e.target.value })} />
                      </div>
                      <input aria-label="ست" inputMode="numeric" className="input ltr-nums" value={ex.sets} onChange={(e) => setEx({ sets: e.target.value })} />
                      <input aria-label="تکرار" className="input ltr-nums" value={ex.reps} onChange={(e) => setEx({ reps: e.target.value })} />
                      <input aria-label="استراحت" inputMode="numeric" className="input ltr-nums" value={ex.rest} onChange={(e) => setEx({ rest: e.target.value })} />
                      <input aria-label="وزنه" inputMode="decimal" className="input ltr-nums" placeholder="—" value={ex.weight} onChange={(e) => setEx({ weight: e.target.value })} />
                      <button type="button" className="btn-ghost px-1 text-err-tx" aria-label="حذف حرکت" disabled={day.exercises.length === 1} onClick={() => setDay(i, (d) => ({ ...d, exercises: d.exercises.filter((_, j) => j !== k) }))}><Trash2 className="size-4" aria-hidden /></button>
                    </div>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-xs font-semibold text-brand-700">جزئیات حرکت: عضله، توضیح، تصویر یا GIF، ویدئو، نکات اجرا</summary>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <input aria-label="عضله‌ی هدف" className="input" placeholder="عضله‌ی هدف (مثلاً سینه)" value={ex.muscle} onChange={(e) => setEx({ muscle: e.target.value })} />
                        <input aria-label="توضیح کوتاه مربی" className="input" placeholder="توضیح کوتاه (مثلاً کنترل در پایین)" value={ex.note} onChange={(e) => setEx({ note: e.target.value })} />
                        <input aria-label="لینک ویدئو" className="input" dir="ltr" placeholder="https://… لینک ویدئوی آموزشی" value={ex.videoUrl} onChange={(e) => setEx({ videoUrl: e.target.value })} />
                        <textarea aria-label="نکات اجرا" className="input min-h-16" placeholder="مراحل اجرا، نکات صحیح، اشتباهات رایج (هر مورد در یک خط)" value={ex.tips} onChange={(e) => setEx({ tips: e.target.value })} />
                        <div className="sm:col-span-2"><ImageUpload endpoint="/uploads" aspect="aspect-[4/3]" label="تصویر یا GIF حرکت" value={ex.imageUrl} onChange={(imageUrl) => setDay(i, (d) => ({ ...d, exercises: d.exercises.map((x, j) => (j === k ? { ...x, imageUrl } : x)) }))} /></div>
                      </div>
                    </details>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-secondary h-8 px-3 text-xs" onClick={() => setPicker(i)}><BookOpen className="size-3.5" aria-hidden />افزودن از کتابخانه‌ی حرکات</button>
                <button type="button" className="btn-ghost h-8 px-2 text-xs" onClick={() => setDay(i, (d) => ({ ...d, exercises: [...d.exercises, blankExercise()] }))}><Plus className="size-3.5" aria-hidden />حرکت دلخواه</button>
              </div>
            </section>
          ))}
          {draft.days.length < 7 && (
            <button type="button" className="btn-secondary" onClick={() => setDraft({ ...draft, days: [...draft.days, { title: `روز ${toPersianDigits(draft.days.length + 1)}`, weekday: "", exercises: [blankExercise()] }] })}><Plus className="size-4" aria-hidden />روز تمرینی</button>
          )}
          {picker != null && (
            <ExercisePicker onClose={() => setPicker(null)} onPick={(lib) => setDay(picker, (d) => {
              const item = { ...blankExercise(), name: lib.name, muscle: lib.muscle, tips: lib.tips.join("\n"), libraryId: lib.id, rest: lib.muscle === "کاردیو" ? "60" : "90", reps: lib.muscle === "کاردیو" ? "10 دقیقه" : "10" };
              // Replace the untouched empty row the day starts with.
              const rest = d.exercises.filter((x) => x.name.trim() || x.libraryId);
              return { ...d, exercises: [...rest, item] };
            })} />
          )}
          {err && <p role="alert" className="field-error">{err.fields ? Object.values(err.fields)[0]?.[0] ?? err.message : err.message}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={save.isPending}>{save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}ذخیره‌ی برنامه</button>
            <button type="button" className="btn-ghost" onClick={() => setMode("view")}>انصراف</button>
          </div>
        </form>
        </>
      )}
    </div>
  );
}

function ProgramView({ p }: { p: Program }) {
  return (
    <section className="card space-y-4" aria-label={p.title}>
      <div>
        <h2 className="card-title">{p.title}{!p.isActive && <span className="mr-2 text-xs font-normal text-ink-3">(بایگانی {jdate(p.archivedAt)})</span>}</h2>
        <p className="text-xs text-ink-2">{p.goal ? `هدف: ${p.goal}، ` : ""}ایجاد {jdate(p.createdAt)}</p>
        {p.notes && <p className="mt-2 whitespace-pre-line text-sm">{p.notes}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {p.days.map((d, i) => (
          <div key={i} className="rounded-xl border border-line p-3">
            <h3 className="mb-2 font-bold">{d.title}{d.weekday != null && <span className="chip mr-2 text-xs font-normal">{WEEKDAYS[d.weekday]}</span>}</h3>
            <ol className="space-y-1.5 text-sm">
              {d.exercises.map((e, k) => (
                <li key={k} className="flex justify-between gap-2">
                  <span>{toPersianDigits(k + 1)}. {e.name}{e.note ? <span className="text-xs text-ink-3"> ({e.note})</span> : null}</span>
                  <span className="whitespace-nowrap text-ink-2">{toPersianDigits(e.sets)} × <bdi dir="ltr">{toPersianDigits(e.reps)}</bdi>{e.restSeconds != null ? `، ${toPersianDigits(e.restSeconds)}ث` : ""}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

type Session = { id: string; dayTitle: string; startedAt: string; finishedAt: string | null; note: string | null; minutes: number | null; exercises: { name: string; plannedSets: number; plannedReps: string; sets: { setNumber: number; reps: number; weightKg: number | null; note: string | null }[] }[] };

/** What the athlete actually did: every logged set, newest workout first. */
function Sessions({ memberId }: { memberId: string }) {
  const q = useQuery({ queryKey: ["workout-sessions", memberId], queryFn: () => api<Session[]>(`/members/${memberId}/workout-sessions`) });
  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} />;
  const list = q.data ?? [];
  return (
    <section className="card space-y-3" aria-labelledby="ws-t">
      <h2 id="ws-t" className="card-title">تمرین‌های ثبت‌شده‌ی شاگرد</h2>
      {list.length === 0 && <p className="text-sm text-ink-2">هنوز تمرینی از اپلیکیشن ثبت نشده است.</p>}
      {list.map((s) => (
        <details key={s.id} className="rounded-xl border border-line p-3">
          <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <b>{s.dayTitle}</b>
            <span className="text-ink-2">{jdate(s.startedAt)}</span>
            {s.minutes != null && <span className="text-ink-2">{toPersianDigits(s.minutes)} دقیقه</span>}
            <span className="chip text-xs">{toPersianDigits(s.exercises.reduce((a, e) => a + e.sets.length, 0))} از {toPersianDigits(s.exercises.reduce((a, e) => a + e.plannedSets, 0))} ست</span>
            {!s.finishedAt && <span className="chip text-xs">در حال انجام</span>}
          </summary>
          {s.note && <p className="mt-2 rounded-lg bg-line-2 p-2 text-sm">یادداشت شاگرد: {s.note}</p>}
          <ul className="mt-2 space-y-1 text-sm">
            {s.exercises.map((e, i) => (
              <li key={i} className="flex flex-wrap justify-between gap-2">
                <span>{e.name} <span className="text-xs text-ink-3">(برنامه: {toPersianDigits(e.plannedSets)} × <bdi dir="ltr">{toPersianDigits(e.plannedReps)}</bdi>)</span></span>
                <span className="text-ink-2">{e.sets.length ? e.sets.map((x) => `${toPersianDigits(x.reps)}${x.weightKg != null ? `×${toPersianDigits(x.weightKg)}kg` : ""}`).join("، ") : "انجام نشد"}</span>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </section>
  );
}
