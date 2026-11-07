"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/client/api";
import { ErrorState, LoadingState } from "@/components/states";
import { Field } from "@/components/field";

type Article = { id: string; slug: string; title: string; excerpt: string; body: string; coverUrl: string | null; tags: string[]; status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; seoTitle: string | null; seoDescription: string | null };
const blank = { slug: "", title: "", excerpt: "", body: "", coverUrl: "", tags: "", status: "DRAFT", seoTitle: "", seoDescription: "" };

export default function ArticleEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const router = useRouter();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "article", id], queryFn: () => api<Article>(`/admin/articles/${id}`), enabled: !isNew });
  const [f, setF] = useState(blank);
  useEffect(() => {
    if (q.data) setF({ ...q.data, coverUrl: q.data.coverUrl ?? "", tags: q.data.tags.join("، "), seoTitle: q.data.seoTitle ?? "", seoDescription: q.data.seoDescription ?? "" });
  }, [q.data]);
  const save = useMutation({
    mutationFn: (status: string) => {
      const body = { ...f, status, tags: f.tags.split(/[،,]/).map((t) => t.trim()).filter(Boolean), seoTitle: f.seoTitle || undefined, seoDescription: f.seoDescription || undefined };
      return isNew ? api<Article>("/admin/articles", { method: "POST", body }) : api<Article>(`/admin/articles/${id}`, { method: "PUT", body });
    },
    onSuccess: (a) => { void qc.invalidateQueries({ queryKey: ["admin", "articles"] }); if (isNew) router.replace(`/admin/articles/${a.id}`); else void qc.invalidateQueries({ queryKey: ["admin", "article", id] }); },
  });
  if (!isNew && q.isPending) return <LoadingState />;
  if (q.isError) return <ErrorState error={q.error} />;
  const err = save.error as ApiError | null;
  const fe = (k: string) => err?.fields?.[k]?.[0];
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()} aria-label="ویرایش مقاله">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">{isNew ? "مقاله‌ی جدید" : "ویرایش مقاله"}</h1>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" disabled={save.isPending} onClick={() => save.mutate("DRAFT")}>ذخیره‌ی پیش‌نویس</button>
          <button type="button" className="btn-primary" disabled={save.isPending} onClick={() => save.mutate("PUBLISHED")}>{f.status === "PUBLISHED" ? "به‌روزرسانی" : "انتشار"}</button>
          {!isNew && f.status !== "ARCHIVED" && <button type="button" className="btn-ghost text-err-tx" disabled={save.isPending} onClick={() => save.mutate("ARCHIVED")}>بایگانی</button>}
        </div>
      </div>
      {err && <p role="alert" className="field-error">{err.message}</p>}
      {save.isSuccess && <p role="status" className="text-sm text-brand-700">ذخیره شد.</p>}
      <div className="card grid gap-3 sm:grid-cols-2">
        <Field label="عنوان" error={fe("title")}><input className="input" value={f.title} onChange={set("title")} /></Field>
        <Field label="نامک (آدرس، لاتین)" error={fe("slug")}><input className="input" dir="ltr" value={f.slug} onChange={set("slug")} placeholder="gym-retention-tips" /></Field>
        <div className="sm:col-span-2"><Field label="خلاصه" error={fe("excerpt")}><textarea className="input min-h-20" value={f.excerpt} onChange={set("excerpt")} /></Field></div>
        <Field label="برچسب‌ها (با ویرگول جدا کنید)"><input className="input" value={f.tags} onChange={set("tags")} /></Field>
        <Field label="آدرس تصویر شاخص (https)" error={fe("coverUrl")}><input className="input" dir="ltr" value={f.coverUrl} onChange={set("coverUrl")} /></Field>
        <Field label="عنوان سئو (حداکثر ۷۰ نویسه)" error={fe("seoTitle")}><input className="input" value={f.seoTitle} onChange={set("seoTitle")} /></Field>
        <Field label="توضیح سئو (حداکثر ۱۷۰ نویسه)" error={fe("seoDescription")}><input className="input" value={f.seoDescription} onChange={set("seoDescription")} /></Field>
      </div>
      <div className="card space-y-2">
        <Field label="متن مقاله" error={fe("body")}>
          <textarea className="input min-h-[480px] font-mono text-sm leading-7" value={f.body} onChange={set("body")} />
        </Field>
        <p className="text-xs text-ink-2">قالب‌بندی: «## » تیتر، «### » زیرتیتر، «- » فهرست، **متن** برای پررنگ، و یک خط خالی بین پاراگراف‌ها.</p>
      </div>
    </form>
  );
}
