import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Check, Dumbbell, QrCode, ShoppingCart, Users, Wallet } from "lucide-react";
import { getPlatformSettings, listPublicPlans, listPublishedArticles } from "@smartgym/core";
import { toPersianDigits } from "@smartgym/shared";
import { coreDeps } from "@/lib/server/deps";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { ArticleCard } from "@/components/site/article-card";

export const dynamic = "force-dynamic";

const toman = (rial: bigint) => `${toPersianDigits((rial / 10n).toLocaleString("en-US")).replace(/,/g, "٬")} تومان`;
const ICONS = [Users, QrCode, Wallet, ShoppingCart, Dumbbell, CalendarCheck];

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPlatformSettings(coreDeps());
  return { title: { absolute: `${s.site.name} | ${s.site.tagline}` }, description: s.landing.heroSubtitle };
}

export default async function Landing() {
  const deps = coreDeps();
  const [s, plans, articles] = await Promise.all([getPlatformSettings(deps), listPublicPlans(deps), listPublishedArticles(deps, { page: 1, pageSize: 3 })]);
  const { site, landing } = s;
  const jsonLd = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: site.name, applicationCategory: "BusinessApplication", operatingSystem: "Web", description: landing.heroSubtitle, inLanguage: "fa" };
  return (
    <>
      <SiteHeader cta={landing.ctaText} />
      <main>
        <section className="bg-gradient-to-b from-brand-50 to-canvas">
          <div className="mx-auto max-w-[1120px] px-4 py-16 text-center sm:py-24">
            <p className="mb-3 inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">{site.tagline}</p>
            <h1 className="mx-auto max-w-3xl text-3xl leading-tight font-black sm:text-5xl">{landing.heroTitle}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-ink-2 sm:text-lg">{landing.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/login" className="btn-primary h-12 px-6 text-base">{landing.ctaText}</Link>
              <Link href="#features" className="btn-secondary h-12 px-6 text-base">امکانات را ببینید</Link>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-[1120px] scroll-mt-20 px-4 py-16" aria-labelledby="f-t">
          <h2 id="f-t" className="mb-10 text-center text-2xl font-extrabold sm:text-3xl">هر چیزی که باشگاه لازم دارد</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {landing.features.map((f, i) => {
              const Icon = ICONS[i % ICONS.length]!;
              return (
                <article key={i} className="card space-y-2">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon className="size-5" aria-hidden /></div>
                  <h3 className="font-bold">{f.title}</h3>
                  <p className="text-sm leading-7 text-ink-2">{f.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="bg-white" aria-labelledby="h-t">
          <div className="mx-auto max-w-[1120px] px-4 py-16">
            <h2 id="h-t" className="mb-10 text-center text-2xl font-extrabold sm:text-3xl">در سه قدم شروع کنید</h2>
            <ol className="grid gap-6 sm:grid-cols-3">
              {[
                ["ثبت‌نام با موبایل", "با شماره موبایل و کد پیامکی وارد شوید و باشگاهتان را بسازید؛ بدون رمز و بدون کارت بانکی."],
                ["تعریف پلن و اعضا", "پلن‌های عضویت را بسازید، اعضا را وارد کنید یا از فایل اکسل بارگذاری کنید."],
                ["شروع کار روزانه", "فروش اشتراک، ثبت ورود، صندوق و گزارش‌ها از همان روز اول آماده است."],
              ].map(([t, b], i) => (
                <li key={t} className="space-y-2 text-center">
                  <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-brand-600 font-black text-white">{toPersianDigits(i + 1)}</span>
                  <h3 className="font-bold">{t}</h3>
                  <p className="text-sm leading-7 text-ink-2">{b}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {landing.showPricing && plans.length > 0 && (
          <section id="pricing" className="mx-auto max-w-[1120px] scroll-mt-20 px-4 py-16" aria-labelledby="p-t">
            <h2 id="p-t" className="mb-2 text-center text-2xl font-extrabold sm:text-3xl">قیمت‌ها</h2>
            <p className="mb-10 text-center text-ink-2">همه‌ی پلن‌ها با دوره‌ی آزمایشی رایگان</p>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((p) => {
                const limits = p.limits as { members?: number | null; branches?: number | null };
                const featured = p.key === "pro";
                return (
                  <article key={p.key} className={`card flex flex-col gap-4 ${featured ? "border-2 border-brand-600" : ""}`}>
                    {featured && <span className="chip self-start border-brand-200 bg-brand-50 font-semibold text-brand-700">پیشنهاد ما</span>}
                    <h3 className="text-xl font-extrabold">{p.nameFa}</h3>
                    <p><span className="text-3xl font-black">{toman(p.monthlyAmountRial)}</span> <span className="text-sm text-ink-2">ماهانه</span></p>
                    <p className="text-sm text-ink-2">پرداخت سالانه: {toman(p.annualAmountRial)}</p>
                    <ul className="flex-1 space-y-2 text-sm">
                      <li className="flex gap-2"><Check className="size-4 flex-none text-brand-600" aria-hidden />{limits.members ? `تا ${toPersianDigits(limits.members)} عضو` : "اعضای نامحدود"}</li>
                      <li className="flex gap-2"><Check className="size-4 flex-none text-brand-600" aria-hidden />{limits.branches ? `${toPersianDigits(limits.branches)} شعبه` : "شعبه‌ی نامحدود"}</li>
                      {p.modules.map((m) => <li key={m.key} className="flex gap-2"><Check className="size-4 flex-none text-brand-600" aria-hidden />{m.nameFa}</li>)}
                    </ul>
                    <Link href="/login" className={featured ? "btn-primary" : "btn-secondary"}>{p.trialDays > 0 ? `${toPersianDigits(p.trialDays)} روز رایگان امتحان کنید` : "شروع"}</Link>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {articles.items.length > 0 && (
          <section className="bg-white" aria-labelledby="b-t">
            <div className="mx-auto max-w-[1120px] px-4 py-16">
              <div className="mb-8 flex items-end justify-between">
                <h2 id="b-t" className="text-2xl font-extrabold sm:text-3xl">از وبلاگ</h2>
                <Link href="/blog" className="text-sm font-semibold text-brand-700">همه‌ی مقالات</Link>
              </div>
              <div className="grid gap-4 md:grid-cols-3">{articles.items.map((a) => <ArticleCard key={a.slug} a={a} />)}</div>
            </div>
          </section>
        )}

        {landing.faq.length > 0 && (
          <section id="faq" className="mx-auto max-w-[760px] scroll-mt-20 px-4 py-16" aria-labelledby="q-t">
            <h2 id="q-t" className="mb-8 text-center text-2xl font-extrabold sm:text-3xl">پرسش‌های متداول</h2>
            <div className="space-y-3">
              {landing.faq.map((f, i) => (
                <details key={i} className="card group">
                  <summary className="cursor-pointer font-bold">{f.q}</summary>
                  <p className="mt-3 text-sm leading-7 text-ink-2">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <section className="bg-brand-700 text-white">
          <div className="mx-auto max-w-[1120px] px-4 py-14 text-center">
            <h2 className="text-2xl font-extrabold sm:text-3xl">آماده‌اید باشگاهتان را منظم کنید؟</h2>
            <Link href="/login" className="btn mt-6 inline-flex h-12 bg-white px-6 text-base text-brand-700 hover:bg-brand-50">{landing.ctaText}</Link>
          </div>
        </section>
      </main>
      <SiteFooter site={site} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
