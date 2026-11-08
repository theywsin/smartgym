import Link from "next/link";
import { formatJalali, toPersianDigits } from "@smartgym/shared";

export type ArticleSummary = { slug: string; title: string; excerpt: string; coverUrl: string | null; tags: string[]; publishedAt: Date | null; readMinutes: number };

export function ArticleCard({ a }: { a: ArticleSummary }) {
  return (
    <article className="card flex flex-col gap-3 p-0">
      {a.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-provided external cover
        <img src={a.coverUrl} alt="" className="aspect-[16/9] w-full rounded-t-2xl object-cover" loading="lazy" />
      ) : (
        <div className="aspect-[16/9] w-full rounded-t-2xl bg-gradient-to-br from-brand-100 to-brand-50" aria-hidden />
      )}
      <div className="flex flex-1 flex-col gap-2 px-5 pb-5">
        <p className="text-xs text-ink-3">{a.publishedAt ? formatJalali(a.publishedAt) : ""} · {toPersianDigits(a.readMinutes)} دقیقه مطالعه</p>
        <h3 className="font-bold leading-7"><Link href={`/blog/${a.slug}`} className="hover:text-brand-700">{a.title}</Link></h3>
        <p className="line-clamp-3 text-sm leading-7 text-ink-2">{a.excerpt}</p>
      </div>
    </article>
  );
}
