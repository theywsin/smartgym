"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, CircleCheck, ExternalLink, ImagePlus, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { ErrorState, LoadingState } from "@/components/states";
import { Field } from "@/components/field";
import { ImageUpload } from "@/components/image-upload";
import { Markdown } from "@/components/site/markdown";

type Article = {
  id: string; slug: string; title: string; excerpt: string; body: string; coverUrl: string | null; tags: string[]; status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  seoTitle: string | null; seoDescription: string | null; focusKeyword: string | null; canonicalUrl: string | null; ogImageUrl: string | null; coverAlt: string | null; noindex: boolean;
};
const blank = { slug: "", title: "", excerpt: "", body: "", coverUrl: "", coverAlt: "", tags: "", status: "DRAFT", seoTitle: "", seoDescription: "", focusKeyword: "", canonicalUrl: "", ogImageUrl: "", noindex: false };
type Form = typeof blank;

const fa = (n: number) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!);

/** Simple on-page SEO checks shown next to the editor. */
function seoChecks(f: Form) {
  const kw = f.focusKeyword.trim();
  const title = f.seoTitle || f.title;
  const desc = f.seoDescription || f.excerpt;
  const words = f.body.split(/\s+/).filter(Boolean).length;
  const has = (t: string) => !!kw && t.includes(kw);
  return [
    [!!kw, "کلمه‌ی کلیدی اصلی تعیین شده است"],
    [has(title), "کلمه‌ی کلیدی در عنوان سئو آمده است"],
    [has(desc), "کلمه‌ی کلیدی در توضیح متا آمده است"],
    [has(f.body.slice(0, 600)), "کلمه‌ی کلیدی در ابتدای متن آمده است"],
    [title.length >= 30 && title.length <= 65, `طول عنوان سئو مناسب است (${fa(title.length)} از ۳۰ تا ۶۵)`],
    [desc.length >= 120 && desc.length <= 160, `طول توضیح متا مناسب است (${fa(desc.length)} از ۱۲۰ تا ۱۶۰)`],
    [words >= 600, `متن کافی است (${fa(words)} کلمه، حداقل ۶۰۰)`],
    [/^## /m.test(f.body), "متن تیتر (##) دارد"],
    [!!f.coverUrl && !!f.coverAlt, "تصویر شاخص و متن جایگزین آن تعیین شده است"],
    [/\[[^\]]+\]\(\//.test(f.body), "لینک داخلی به صفحه‌های دیگر سایت دارد"],
  ] as const;
}

export default function ArticleEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const router = useRouter();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "article", id], queryFn: () => api<Article>(`/admin/articles/${id}`), enabled: !isNew });
  const [f, setF] = useState<Form>(blank);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const [imgBusy, setImgBusy] = useState(false);
  useEffect(() => {
    if (q.data) {
      const d = q.data;
      setF({ ...blank, ...d, coverUrl: d.coverUrl ?? "", coverAlt: d.coverAlt ?? "", tags: d.tags.join("، "), seoTitle: d.seoTitle ?? "", seoDescription: d.seoDescription ?? "", focusKeyword: d.focusKeyword ?? "", canonicalUrl: d.canonicalUrl ?? "", ogImageUrl: d.ogImageUrl ?? "" });
    }
  }, [q.data]);
  const save = useMutation({
    mutationFn: (status: string) => {
      const opt = (v: string) => v.trim() || undefined;
      const body = {
        ...f, status, tags: f.tags.split(/[،,]/).map((t) => t.trim()).filter(Boolean),
        seoTitle: opt(f.seoTitle), seoDescription: opt(f.seoDescription), focusKeyword: opt(f.focusKeyword), canonicalUrl: opt(f.canonicalUrl), ogImageUrl: opt(f.ogImageUrl), coverAlt: opt(f.coverAlt),
      };
      return isNew ? api<Article>("/admin/articles", { method: "POST", body }) : api<Article>(`/admin/articles/${id}`, { method: "PUT", body });
    },
    onSuccess: (a) => { void qc.invalidateQueries({ queryKey: ["admin", "articles"] }); if (isNew) router.replace(`/admin/articles/${a.id}`); else void qc.invalidateQueries({ queryKey: ["admin", "article", id] }); },
  });
  const checks = useMemo(() => seoChecks(f), [f]);
  if (!isNew && q.isPending) return <LoadingState />;
  if (q.isError) return <ErrorState error={q.error} />;
  const err = save.error as ApiError | null;
  const fe = (k: string) => err?.fields?.[k]?.[0];
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const insertAtCursor = (text: string) => {
    const el = bodyRef.current;
    const pos = el ? el.selectionStart : f.body.length;
    setF((s) => ({ ...s, body: `${s.body.slice(0, pos)}${text}${s.body.slice(pos)}` }));
  };
  const score = checks.filter(([ok]) => ok).length;
  const snippetTitle = (f.seoTitle || f.title || "عنوان مقاله").slice(0, 65);
  const snippetDesc = (f.seoDescription || f.excerpt || "توضیح متا اینجا نمایش داده می‌شود.").slice(0, 160);

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()} aria-label="ویرایش مقاله">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">{isNew ? "مقاله‌ی جدید" : "ویرایش مقاله"}</h1>
        <div className="flex flex-wrap gap-2">
          {!isNew && f.status === "PUBLISHED" && <a href={`/blog/${f.slug}`} target="_blank" rel="noopener" className="btn-ghost"><ExternalLink className="size-4" aria-hidden />مشاهده در سایت</a>}
          <button type="button" className="btn-secondary" disabled={save.isPending} onClick={() => save.mutate("DRAFT")}>ذخیره‌ی پیش‌نویس</button>
          <button type="button" className="btn-primary" disabled={save.isPending} onClick={() => save.mutate("PUBLISHED")}>{f.status === "PUBLISHED" ? "به‌روزرسانی" : "انتشار"}</button>
          {!isNew && f.status !== "ARCHIVED" && <button type="button" className="btn-ghost text-err-tx" disabled={save.isPending} onClick={() => save.mutate("ARCHIVED")}>بایگانی</button>}
        </div>
      </div>
      {err && <p role="alert" className="field-error">{err.fields ? `${err.message} (${Object.values(err.fields)[0]?.[0] ?? ""})` : err.message}</p>}
      {save.isSuccess && <p role="status" className="text-sm text-brand-700">ذخیره شد.</p>}

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="card grid gap-3 sm:grid-cols-2">
            <Field label="عنوان" error={fe("title")}><input className="input" value={f.title} onChange={set("title")} /></Field>
            <Field label="نامک (آدرس، لاتین)" error={fe("slug")}><input className="input" dir="ltr" value={f.slug} onChange={set("slug")} placeholder="gym-retention-tips" /></Field>
            <div className="sm:col-span-2"><Field label="خلاصه" error={fe("excerpt")}><textarea className="input min-h-20" value={f.excerpt} onChange={set("excerpt")} /></Field></div>
            <Field label="برچسب‌ها (با ویرگول جدا کنید)"><input className="input" value={f.tags} onChange={set("tags")} /></Field>
            <Field label="متن جایگزین تصویر شاخص (alt)" error={fe("coverAlt")}><input className="input" value={f.coverAlt} onChange={set("coverAlt")} /></Field>
            <div className="sm:col-span-2"><ImageUpload label="تصویر شاخص" value={f.coverUrl} onChange={(coverUrl) => setF((s) => ({ ...s, coverUrl }))} /></div>
          </div>

          <div className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div role="tablist" className="flex gap-1">
                {(["write", "preview"] as const).map((t) => (
                  <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${tab === t ? "bg-brand-50 text-brand-700" : "text-ink-2"}`}>{t === "write" ? "نوشتن" : "پیش‌نمایش"}</button>
                ))}
              </div>
              {tab === "write" && (
                <button type="button" className="btn-secondary h-9 text-sm" disabled={imgBusy} onClick={() => imgInput.current?.click()}>
                  {imgBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}افزودن تصویر به متن
                </button>
              )}
              <input ref={imgInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" aria-label="تصویر داخل متن"
                onChange={async (e) => {
                  const file = e.target.files?.[0]; e.target.value = "";
                  if (!file) return;
                  setImgBusy(true);
                  try { const r = await api<{ url: string }>("/admin/uploads", { method: "POST", file }); insertAtCursor(`\n\n![توضیح تصویر](${r.url})\n\n`); }
                  catch (er) { alert(er instanceof ApiError ? er.message : "بارگذاری انجام نشد."); }
                  finally { setImgBusy(false); }
                }} />
            </div>
            {tab === "write" ? (
              <>
                <Field label="متن مقاله" error={fe("body")}>
                  <textarea ref={bodyRef} className="input min-h-[520px] text-sm leading-7" value={f.body} onChange={set("body")} />
                </Field>
                <p className="text-xs leading-6 text-ink-2">قالب‌بندی: «## » تیتر، «### » زیرتیتر، «- » فهرست، {"«> »"} نقل‌قول، **متن** پررنگ، [متن لینک](/blog/...) لینک، و ![توضیح](آدرس) تصویر در یک خط جدا.</p>
              </>
            ) : (
              <article className="min-h-[520px] rounded-xl border border-line p-5 text-[17px]">
                {f.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- preview
                  <img src={f.coverUrl} alt={f.coverAlt} className="mb-5 w-full rounded-2xl" />
                )}
                <h1 className="mb-3 text-3xl font-black">{f.title || "عنوان مقاله"}</h1>
                <p className="mb-4 text-lg leading-8 text-ink-2">{f.excerpt}</p>
                <Markdown source={f.body} />
              </article>
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4">
          <div className="card space-y-3">
            <h2 className="card-title">سئو</h2>
            <div className="rounded-xl border border-line bg-white p-3" aria-label="پیش‌نمایش در نتایج گوگل">
              <p className="truncate text-xs text-ink-3" dir="ltr">{typeof window !== "undefined" ? window.location.host : ""}/blog/{f.slug || "..."}</p>
              <p className="mt-1 text-[17px] leading-6 text-[#1a0dab]">{snippetTitle}</p>
              <p className="mt-1 text-xs leading-5 text-ink-2">{snippetDesc}</p>
            </div>
            <Field label={`عنوان سئو (${fa(f.seoTitle.length)}/۷۰)`} error={fe("seoTitle")}><input className="input" value={f.seoTitle} onChange={set("seoTitle")} placeholder={f.title} /></Field>
            <Field label={`توضیح متا (${fa(f.seoDescription.length)}/۱۷۰)`} error={fe("seoDescription")}><textarea className="input min-h-20" value={f.seoDescription} onChange={set("seoDescription")} placeholder={f.excerpt} /></Field>
            <Field label="کلمه‌ی کلیدی اصلی" error={fe("focusKeyword")}><input className="input" value={f.focusKeyword} onChange={set("focusKeyword")} /></Field>
            <Field label="آدرس کنونیکال (اختیاری، https)" error={fe("canonicalUrl")}><input className="input" dir="ltr" value={f.canonicalUrl} onChange={set("canonicalUrl")} /></Field>
            <ImageUpload label="تصویر اشتراک‌گذاری (Open Graph، اختیاری)" value={f.ogImageUrl} onChange={(ogImageUrl) => setF((s) => ({ ...s, ogImageUrl }))} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.noindex} onChange={(e) => setF({ ...f, noindex: e.target.checked })} />در نتایج موتورهای جستجو نمایش داده نشود (noindex)</label>
          </div>
          <div className="card space-y-2">
            <h2 className="card-title">بررسی سئو: {fa(score)} از {fa(checks.length)}</h2>
            <ul className="space-y-1.5 text-sm">
              {checks.map(([ok, label]) => (
                <li key={label} className="flex items-start gap-2">
                  {ok ? <CircleCheck className="mt-0.5 size-4 flex-none text-brand-600" aria-hidden /> : <CircleAlert className="mt-0.5 size-4 flex-none text-warn" aria-hidden />}
                  <span className={ok ? "" : "text-ink-2"}>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </form>
  );
}
