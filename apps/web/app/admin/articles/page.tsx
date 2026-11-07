"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api } from "@/lib/client/api";
import { jdate } from "@/lib/client/format";
import { ErrorState, LoadingState, EmptyState } from "@/components/states";

type Row = { id: string; slug: string; title: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; publishedAt: string | null; updatedAt: string };
const LABEL = { DRAFT: "پیش‌نویس", PUBLISHED: "منتشر شده", ARCHIVED: "بایگانی" } as const;

export default function ArticlesAdmin() {
  const q = useQuery({ queryKey: ["admin", "articles"], queryFn: () => api<Row[]>("/admin/articles") });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">مقالات وبلاگ</h1>
        <Link href="/admin/articles/new" className="btn-primary"><Plus className="size-4" aria-hidden /> مقاله‌ی جدید</Link>
      </div>
      {q.isPending && <LoadingState />}
      {q.isError && <ErrorState error={q.error} onRetry={() => q.refetch()} />}
      {q.data?.length === 0 && <EmptyState title="هنوز مقاله‌ای ننوشته‌اید" />}
      {q.data && q.data.length > 0 && (
        <ul className="card divide-y divide-line p-0">
          {q.data.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <Link href={`/admin/articles/${a.id}`} className="min-w-0 flex-1 font-semibold hover:text-brand-700">{a.title}</Link>
              <span className="chip text-xs">{LABEL[a.status]}</span>
              <span className="text-xs text-ink-3">ویرایش: {jdate(a.updatedAt)}</span>
              {a.status === "PUBLISHED" && <Link href={`/blog/${a.slug}`} target="_blank" className="text-xs text-brand-700">مشاهده</Link>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
