import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft, BrainCircuit, CalendarDays, ChartNoAxesCombined, CirclePlay, CreditCard, Dumbbell, Headset, LayoutDashboard,
  Rocket, Settings, ShieldCheck, ShoppingCart, TrendingUp, Users, Wallet,
} from "lucide-react";
import { getPlatformSettings, listPublicPlans, listPublishedArticles } from "@smartgym/core";
import { formatJalali, toPersianDigits } from "@smartgym/shared";
import { coreDeps } from "@/lib/server/deps";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { AppDownload } from "@/components/site/app-download";
import { Pricing, type PricingPlan } from "@/components/site/pricing";

export const dynamic = "force-dynamic";

const FEATURE_ICONS = [Users, CalendarDays, CreditCard, ShoppingCart, Dumbbell, ChartNoAxesCombined, BrainCircuit, Headset];
const PLAN_NOTES = ["مناسب برای باشگاه‌های کوچک", "مناسب برای باشگاه‌های حرفه‌ای", "برای مجموعه‌های بزرگ"];

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPlatformSettings(coreDeps());
  return { title: { absolute: `${s.site.name} | ${s.site.tagline}` }, description: s.landing.heroSubtitle };
}

/** "text *highlight* text": the starred part is shown in brand green. */
function Highlighted({ text }: { text: string }) {
  return <>{text.split(/(\*[^*]+\*)/).map((part, i) => (part.startsWith("*") && part.endsWith("*") ? <span key={i} className="text-brand-500">{part.slice(1, -1)}</span> : part))}</>;
}

export default async function Landing() {
  const deps = coreDeps();
  const [s, plans, articles] = await Promise.all([getPlatformSettings(deps), listPublicPlans(deps), listPublishedArticles(deps, { page: 1, pageSize: 3 })]);
  const { site, landing } = s;
  const plainTitle = landing.heroTitle.replace(/\*/g, "");
  const jsonLd = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: site.name, applicationCategory: "BusinessApplication", operatingSystem: "Web, Android, iOS", description: landing.heroSubtitle, inLanguage: "fa" };
  const pricing: PricingPlan[] = plans.slice(0, 3).map((p, i) => {
    const limits = p.limits as { members?: number | null; branches?: number | null };
    return {
      key: p.key, nameFa: p.nameFa, monthly: p.monthlyAmountRial.toString(), annual: p.annualAmountRial.toString(), trialDays: p.trialDays,
      note: PLAN_NOTES[i] ?? "", featured: plans.length >= 3 ? i === 1 : false,
      features: [limits.members ? `تا ${toPersianDigits(limits.members)} عضو` : "اعضای نامحدود", limits.branches ? `${toPersianDigits(limits.branches)} شعبه` : "شعبه‌ی نامحدود", ...p.modules.slice(0, 4).map((m) => m.nameFa)],
    };
  });

  return (
    <>
      {/* ───────── Hero ───────── */}
      <div className="relative overflow-hidden bg-[#07130d] text-white">
        <picture>
          <source media="(min-width: 768px)" srcSet="/landing/hero.jpg" />
          {/* eslint-disable-next-line @next/next/no-img-element -- static hero image */}
          <img src="/landing/hero-sm.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-[15%_center] md:object-left" fetchPriority="high" />
        </picture>
        {/* Darken the text side (right in RTL) so the copy stays readable over the photo. */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-l from-[#050d09] via-[#050d09]/85 to-[#050d09]/10 max-md:bg-[#050d09]/70" />
        <SiteHeader cta={landing.ctaText} dark />
        <section className="relative mx-auto flex min-h-[560px] max-w-[1180px] items-center px-4 pb-16 pt-6 lg:min-h-[640px]" aria-labelledby="hero-t">
          <div className="max-w-xl space-y-6">
            <h1 id="hero-t" className="text-4xl leading-[1.35] font-black sm:text-5xl"><Highlighted text={landing.heroTitle} /></h1>
            <p className="text-base leading-8 text-white/80 sm:text-lg">{landing.heroSubtitle}</p>
            <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-white/90">
              <li className="flex items-center gap-2"><Headset className="size-5 text-brand-500" aria-hidden />پشتیبانی حرفه‌ای</li>
              <li className="flex items-center gap-2"><ShieldCheck className="size-5 text-brand-500" aria-hidden />امن و مطمئن</li>
              <li className="flex items-center gap-2"><Rocket className="size-5 text-brand-500" aria-hidden />راه‌اندازی سریع</li>
            </ul>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/login" className="btn h-12 gap-2 rounded-full bg-brand-500 px-7 text-base text-white shadow-[0_8px_24px_rgba(34,197,94,0.35)] hover:bg-brand-600">{landing.ctaText}<ArrowLeft className="size-4" aria-hidden /></Link>
              <Link href="#platform" className="btn h-12 gap-2 rounded-full px-6 text-base text-white ring-1 ring-white/40 hover:bg-white/10"><CirclePlay className="size-5" aria-hidden />مشاهده دموی محصول</Link>
            </div>
          </div>
        </section>
      </div>

      <main>
        {/* ───────── Platform ───────── */}
        <section id="platform" className="relative scroll-mt-20 overflow-hidden bg-gradient-to-b from-white to-brand-50/60" aria-labelledby="pl-t">
          <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-4 py-16 lg:grid-cols-[1fr_1.25fr]">
            <div className="space-y-4">
              <span className="chip-brand">راهکار کامل باشگاه‌های ورزشی</span>
              <h2 id="pl-t" className="text-3xl leading-snug font-black">یک پلتفرم جامع برای مدیریت حرفه‌ای باشگاه شما</h2>
              <p className="leading-8 text-ink-2">تمام نیازهای باشگاه شما در یک پنل قدرتمند: از مدیریت اعضا و برنامه‌های تمرینی تا فروش آنلاین، صندوق و گزارش‌های تحلیلی.</p>
              <Link href="#features" className="btn-primary h-11 gap-2 rounded-full px-6">بیشتر بدانید<ArrowLeft className="size-4" aria-hidden /></Link>
            </div>
            <ProductMockup />
          </div>
        </section>

        {/* ───────── Features ───────── */}
        <section id="features" className="mx-auto max-w-[1180px] scroll-mt-20 px-4 py-16" aria-labelledby="f-t">
          <div className="mb-10 space-y-3 text-center">
            <span className="chip-brand">قابلیت‌های کلیدی</span>
            <h2 id="f-t" className="text-3xl font-black">همه چیز برای مدیریت بهتر باشگاه</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {landing.features.map((f, i) => {
              const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length]!;
              return (
                <article key={i} className="group rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-line transition hover:-translate-y-1 hover:shadow-md hover:ring-brand-200">
                  <Icon className="mx-auto mb-3 size-8 text-brand-600" aria-hidden strokeWidth={1.75} />
                  <h3 className="font-extrabold">{f.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-ink-2">{f.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* ───────── Pricing ───────── */}
        {landing.showPricing && pricing.length > 0 && (
          <section id="pricing" className="relative scroll-mt-20 overflow-hidden bg-gradient-to-l from-brand-50 via-white to-white" aria-labelledby="p-t">
            {/* eslint-disable-next-line @next/next/no-img-element -- static marketing image */}
            <img src="/landing/pricing-gear.jpg" alt="" aria-hidden className="absolute inset-y-0 left-0 hidden h-full w-[22%] object-cover [mask-image:linear-gradient(to_left,transparent,black_40%)] xl:block" />
            <div className="relative mx-auto max-w-[1180px] px-4 py-16 xl:pl-[20%]">
              <Pricing plans={pricing} />
            </div>
          </section>
        )}

        {/* ───────── Blog ───────── */}
        {articles.items.length > 0 && (
          <section className="mx-auto max-w-[1180px] px-4 py-16" aria-labelledby="b-t">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-2">
                <span className="chip-brand">مقالات و آموزش‌ها</span>
                <h2 id="b-t" className="text-3xl font-black">آخرین مطالب وبلاگ</h2>
              </div>
              <Link href="/blog" className="flex items-center gap-1 text-sm font-bold text-brand-700">مشاهده همه مقالات<ArrowLeft className="size-4" aria-hidden /></Link>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {articles.items.map((a) => (
                <article key={a.slug} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-line">
                  {a.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin-provided cover
                    <img src={a.coverUrl} alt="" className="aspect-[16/8] w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex aspect-[16/8] w-full items-center justify-center bg-gradient-to-br from-[#0b1d14] to-brand-700" aria-hidden><Dumbbell className="size-10 text-brand-500" /></div>
                  )}
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <h3 className="font-extrabold leading-7"><Link href={`/blog/${a.slug}`} className="hover:text-brand-700">{a.title}</Link></h3>
                    <div className="mt-auto flex items-center justify-between text-xs text-ink-3">
                      <span>{a.publishedAt ? formatJalali(a.publishedAt) : ""} · {toPersianDigits(a.readMinutes)} دقیقه</span>
                      <Link href={`/blog/${a.slug}`} className="flex items-center gap-1 font-bold text-brand-700">مطالعه بیشتر<ArrowLeft className="size-3.5" aria-hidden /></Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <AppDownload apps={s.landing.apps} name={s.site.name} />

        {/* ───────── FAQ + CTA ───────── */}
        <section id="faq" className="mx-auto grid max-w-[1180px] scroll-mt-20 items-start gap-6 px-4 pb-16 lg:grid-cols-2" aria-labelledby="q-t">
          {landing.faq.length > 0 && (
            <div>
              <h2 id="q-t" className="mb-4 text-2xl font-black">سوالات متداول</h2>
              <div className="divide-y divide-line rounded-2xl bg-white shadow-sm ring-1 ring-line">
                {landing.faq.map((f, i) => (
                  <details key={i} className="group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
                      {f.q}<span className="text-xl leading-none text-ink-3 transition group-open:rotate-45" aria-hidden>+</span>
                    </summary>
                    <p className="mt-3 text-sm leading-7 text-ink-2">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#0b2a1a] to-[#0f3d24] p-8 text-white lg:mt-12">
            <Dumbbell aria-hidden className="absolute -bottom-6 -left-6 size-40 rotate-[-20deg] text-white/5" />
            <h2 className="text-2xl font-black">آماده‌اید باشگاه خود را هوشمندتر کنید؟</h2>
            <p className="mt-2 text-sm text-white/75">همین حالا شروع کنید و از قدرت {site.name} بهره‌مند شوید.</p>
            <Link href="/login" className="btn mt-6 h-11 gap-2 rounded-full bg-white px-6 text-brand-800 hover:bg-brand-50">{landing.ctaText}<ArrowLeft className="size-4" aria-hidden /></Link>
          </div>
        </section>
      </main>
      <SiteFooter site={site} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ ...jsonLd, name: site.name, alternateName: plainTitle }).replace(/</g, "\\u003c") }} />
    </>
  );
}

/** Illustrative product preview (not live data): a manager dashboard and the athlete app. */
function ProductMockup() {
  const nav: [typeof LayoutDashboard, string][] = [[LayoutDashboard, "داشبورد"], [Users, "اعضا"], [Dumbbell, "تمرینات"], [ChartNoAxesCombined, "گزارش‌ها"], [Wallet, "مالی"], [Settings, "تنظیمات"]];
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[640px] pt-4 pb-6 select-none">
      <div className="absolute -top-6 -left-6 size-40 rounded-full bg-brand-500/25 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 lg:ml-24">
        <div className="flex">
          <div className="w-28 flex-none bg-[#0b1d14] p-3 text-[10px] text-white/70">
            <p className="mb-4 flex items-center gap-1 font-extrabold text-white"><Dumbbell className="size-3.5 text-brand-500" />{"SmartGym"}</p>
            {nav.map(([I, t], i) => <p key={t} className={`mb-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 ${i === 0 ? "bg-brand-600/25 text-brand-500" : ""}`}><I className="size-3" />{t}</p>)}
          </div>
          <div className="flex-1 space-y-3 bg-canvas p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white p-2 ring-1 ring-line"><p className="text-[9px] text-ink-3">اعضای فعال</p><p className="text-sm font-black">۲٬۸۵۰</p></div>
              <div className="rounded-lg bg-white p-2 ring-1 ring-line"><p className="text-[9px] text-ink-3">درآمد ماهانه</p><p className="text-sm font-black">۴۲۰ میلیون تومان</p></div>
            </div>
            <div className="rounded-lg bg-white p-2 ring-1 ring-line">
              <div className="mb-1 flex items-center justify-between"><p className="text-[10px] font-bold">روند رشد اعضا</p><span className="flex items-center gap-0.5 rounded bg-brand-600 px-1 text-[9px] font-bold text-white"><TrendingUp className="size-2.5" />۴۲٪</span></div>
              <svg viewBox="0 0 300 90" className="h-32 w-full">
                <defs><linearGradient id="lg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#22c55e" stopOpacity=".35" /><stop offset="1" stopColor="#22c55e" stopOpacity="0" /></linearGradient></defs>
                <path d="M0 70 C30 60 40 40 70 48 S110 75 140 55 S190 20 215 38 S260 60 300 12 L300 90 L0 90Z" fill="url(#lg)" />
                <path d="M0 70 C30 60 40 40 70 48 S110 75 140 55 S190 20 215 38 S260 60 300 12" fill="none" stroke="#16a34a" strokeWidth="2.5" />
              </svg>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white p-2 ring-1 ring-line"><p className="text-[10px] font-bold">اعضای جدید</p><div className="flex -space-x-1.5 space-x-reverse">{["#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d"].map((c) => <span key={c} className="size-5 rounded-full ring-2 ring-white" style={{ background: c }} />)}</div></div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 left-0 aspect-[9/17] w-[28%] max-w-[170px] overflow-hidden rounded-[24px] border-[6px] border-[#111] bg-white shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- static screenshot of the athlete app */}
        <img src="/landing/app-athlete.png" alt="" className="w-full object-cover object-top" />
      </div>
    </div>
  );
}
