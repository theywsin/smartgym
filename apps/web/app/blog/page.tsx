import type { Metadata } from "next";
import Link from "next/link";
import { getPlatformSettings, listPublishedArticles } from "@smartgym/core";
import { toPersianDigits } from "@smartgym/shared";
import { coreDeps } from "@/lib/server/deps";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { ArticleCard } from "@/components/site/article-card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "مقالات", description: "مقاله‌های آموزشی درباره‌ی مدیریت باشگاه، جذب و نگهداری اعضا و امور مالی باشگاه‌های ورزشی." };

const PAGE = 9;

export default async function Blog({ searchParams }: { searchParams: Promise<{ page?: string; tag?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const tag = sp.tag?.slice(0, 30);
  const deps = coreDeps();
  const [s, list] = await Promise.all([getPlatformSettings(deps), listPublishedArticles(deps, { page, pageSize: PAGE, tag })]);
  const pages = Math.max(1, Math.ceil(list.total / PAGE));
  const qs = (p: number) => `/blog?${new URLSearchParams({ ...(tag ? { tag } : {}), page: String(p) })}`;
  return (
    <>
      <SiteHeader cta={s.landing.ctaText} />
      <main className="mx-auto max-w-[1120px] px-4 py-12">
        <h1 className="text-3xl font-black">مقالات</h1>
        <p className="mt-2 text-ink-2">{tag ? <>برچسب «{tag}» · <Link href="/blog" className="text-brand-700">همه‌ی مقالات</Link></> : "راهنماهای کاربردی برای مدیران و مربیان باشگاه"}</p>
        {list.items.length === 0 ? (
          <p className="mt-10 text-ink-2">هنوز مقاله‌ای منتشر نشده است.</p>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-3">{list.items.map((a) => <ArticleCard key={a.slug} a={a} />)}</div>
        )}
        {pages > 1 && (
          <nav aria-label="صفحه‌بندی" className="mt-10 flex items-center justify-center gap-3 text-sm">
            {page > 1 && <Link href={qs(page - 1)} className="btn-secondary h-9">قبلی</Link>}
            <span>صفحه {toPersianDigits(page)} از {toPersianDigits(pages)}</span>
            {page < pages && <Link href={qs(page + 1)} className="btn-secondary h-9">بعدی</Link>}
          </nav>
        )}
      </main>
      <SiteFooter site={s.site} />
    </>
  );
}
