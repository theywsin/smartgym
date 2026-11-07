import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppError, getPlatformSettings, getPublishedArticle } from "@smartgym/core";
import { formatJalali, toPersianDigits } from "@smartgym/shared";
import { appUrl, coreDeps } from "@/lib/server/deps";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { ArticleCard } from "@/components/site/article-card";
import { Markdown, headingsOf } from "@/components/site/markdown";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  try {
    return await getPublishedArticle(coreDeps(), slug);
  } catch (e) {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await load((await params).slug);
  return {
    title: a.seoTitle ?? a.title,
    description: a.seoDescription ?? a.excerpt,
    alternates: { canonical: `/blog/${a.slug}` },
    openGraph: { type: "article", title: a.title, description: a.excerpt, publishedTime: a.publishedAt?.toISOString(), images: a.coverUrl ? [a.coverUrl] : undefined },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const a = await load((await params).slug);
  const s = await getPlatformSettings(coreDeps());
  const toc = headingsOf(a.body);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "BlogPosting", headline: a.title, description: a.excerpt, inLanguage: "fa",
    datePublished: a.publishedAt?.toISOString(), dateModified: a.updatedAt.toISOString(), mainEntityOfPage: `${appUrl()}/blog/${a.slug}`,
    publisher: { "@type": "Organization", name: s.site.name }, ...(a.coverUrl ? { image: a.coverUrl } : {}),
  };
  return (
    <>
      <SiteHeader cta={s.landing.ctaText} />
      <main className="mx-auto max-w-[1120px] px-4 py-10">
        <nav aria-label="مسیر" className="mb-4 text-sm text-ink-2"><Link href="/" className="hover:text-ink">خانه</Link> / <Link href="/blog" className="hover:text-ink">مقالات</Link></nav>
        <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
          <article className="min-w-0">
            <header className="mb-6 space-y-3">
              <h1 className="text-3xl leading-tight font-black sm:text-4xl">{a.title}</h1>
              <p className="text-sm text-ink-3">{a.publishedAt ? formatJalali(a.publishedAt) : ""} · {toPersianDigits(a.readMinutes)} دقیقه مطالعه</p>
              <p className="text-lg leading-8 text-ink-2">{a.excerpt}</p>
              {a.tags.length > 0 && <ul className="flex flex-wrap gap-2">{a.tags.map((t) => <li key={t}><Link href={`/blog?tag=${encodeURIComponent(t)}`} className="chip hover:border-brand-200">{t}</Link></li>)}</ul>}
            </header>
            {a.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- admin-provided cover
              <img src={a.coverUrl} alt="" className="mb-6 w-full rounded-2xl" />
            )}
            <div className="text-[17px] text-ink"><Markdown source={a.body} /></div>
            <aside className="mt-12 rounded-2xl bg-brand-50 p-6 text-center">
              <p className="text-lg font-bold">این کارها را با {s.site.name} ساده کنید</p>
              <Link href="/login" className="btn-primary mt-4 inline-flex">{s.landing.ctaText}</Link>
            </aside>
          </article>
          {toc.length > 2 && (
            <aside className="hidden lg:block">
              <nav aria-label="فهرست مطالب" className="card sticky top-24 space-y-2 text-sm">
                <p className="font-bold">فهرست مطالب</p>
                <ol className="space-y-1.5">{toc.map((h) => <li key={h.id}><a href={`#${h.id}`} className="text-ink-2 hover:text-brand-700">{h.text}</a></li>)}</ol>
              </nav>
            </aside>
          )}
        </div>
        {a.related.length > 0 && (
          <section className="mt-16" aria-labelledby="rel">
            <h2 id="rel" className="mb-6 text-2xl font-extrabold">مقاله‌های مرتبط</h2>
            <div className="grid gap-4 md:grid-cols-3">{a.related.map((r) => <ArticleCard key={r.slug} a={r} />)}</div>
          </section>
        )}
      </main>
      <SiteFooter site={s.site} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
