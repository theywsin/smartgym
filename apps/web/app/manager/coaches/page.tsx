"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { formatIranMobile, toPersianDigits } from "@smartgym/shared";
import { api, ApiError } from "@/lib/client/api";
import { useCan } from "@/lib/client/me";
import { fa } from "@/lib/client/format";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";

type Coach = {
  userId: string; phone: string; firstName: string | null; lastName: string | null; bio: string | null;
  specializations: string[]; commissionRateBp: number | null; activeAthletes: number;
};

export default function CoachesPage() {
  const qc = useQueryClient();
  const canManage = useCan("coaches.manage");
  const canStaff = useCan("staff.manage");
  const coaches = useQuery({ queryKey: ["coaches"], queryFn: () => api<Coach[]>("/coaches") });
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ bio: "", specializations: "", commission: "" });
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (userId: string) => {
      const pct = draft.commission.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).trim();
      return api(`/coaches/${userId}`, {
        method: "PATCH",
        body: {
          bio: draft.bio,
          specializations: draft.specializations.split(/[،,]/).map((s) => s.trim()).filter(Boolean),
          commissionRateBp: pct === "" ? null : Math.round(Number(pct) * 100),
        },
      });
    },
    onSuccess: () => { setEditing(null); void qc.invalidateQueries({ queryKey: ["coaches"] }); },
    onError: (e) => setError(e instanceof ApiError ? e.message : "خطا در ذخیره"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">مربیان</h1>
        <p className="text-sm text-ink-2">
          مربیان از بخش <Link href="/manager/staff" className="font-semibold text-brand-700 hover:underline">کارکنان</Link> با نقش «مربی» اضافه می‌شوند.
        </p>
      </div>
      {coaches.isPending && <LoadingState />}
      {coaches.isError && <ErrorState error={coaches.error} onRetry={() => coaches.refetch()} />}
      {coaches.data?.length === 0 && (
        <div className="card">
          <EmptyState
            title="هنوز مربی‌ای اضافه نشده است"
            action={canStaff ? <Link href="/manager/staff" className="btn-primary">افزودن مربی</Link> : undefined}
          />
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {coaches.data?.map((c) => {
          const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || toPersianDigits(formatIranMobile(c.phone));
          return (
            <article key={c.userId} className="card space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-info-bg font-bold text-info-tx" aria-hidden>
                  {(c.firstName ?? "م").slice(0, 1)}
                </span>
                <div>
                  <h2 className="card-title">{name}</h2>
                  <p className="ltr-nums text-xs text-ink-3">{toPersianDigits(formatIranMobile(c.phone))}</p>
                </div>
              </div>
              {editing === c.userId ? (
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const pct = Number(draft.commission.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).trim() || "0");
                    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return setError("درصد باید عددی بین ۰ تا ۱۰۰ باشد.");
                    setError(null);
                    save.mutate(c.userId);
                  }}
                >
                  <div>
                    <label className="label" htmlFor={`sp-${c.userId}`}>تخصص‌ها (با ویرگول جدا کنید)</label>
                    <input id={`sp-${c.userId}`} className="input" value={draft.specializations} onChange={(e) => setDraft({ ...draft, specializations: e.target.value })} />
                  </div>
                  <div>
                    <label className="label" htmlFor={`bio-${c.userId}`}>معرفی کوتاه</label>
                    <textarea id={`bio-${c.userId}`} rows={2} className="input h-auto py-2" value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />
                  </div>
                  <div>
                    <label className="label" htmlFor={`cm-${c.userId}`}>سهم مربی از فروش (درصد)</label>
                    <input id={`cm-${c.userId}`} className="input ltr-nums w-32 text-left" inputMode="decimal" value={draft.commission} onChange={(e) => setDraft({ ...draft, commission: e.target.value })} />
                  </div>
                  {error && <p role="alert" className="field-error">{error}</p>}
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary h-9" disabled={save.isPending}>
                      {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                      ذخیره
                    </button>
                    <button type="button" className="btn-secondary h-9" onClick={() => setEditing(null)}>انصراف</button>
                  </div>
                </form>
              ) : (
                <>
                  {c.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {c.specializations.map((s) => <span key={s} className="chip">{s}</span>)}
                    </div>
                  )}
                  {c.bio && <p className="text-sm text-ink-2">{c.bio}</p>}
                  <p className="text-sm">
                    <Link href={`/manager/members?coach=${c.userId}`} className="font-semibold text-brand-700 hover:underline">
                      {fa(c.activeAthletes)} شاگرد
                    </Link>
                    {c.commissionRateBp !== null && <span className="text-ink-2">، سهم {fa(c.commissionRateBp / 100)}٪</span>}
                  </p>
                  {canManage && (
                    <button
                      type="button"
                      className="btn-secondary h-8 px-3 text-xs"
                      onClick={() => {
                        setError(null);
                        setEditing(c.userId);
                        setDraft({
                          bio: c.bio ?? "",
                          specializations: c.specializations.join("، "),
                          commission: c.commissionRateBp === null ? "" : String(c.commissionRateBp / 100),
                        });
                      }}
                    >
                      ویرایش
                    </button>
                  )}
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
