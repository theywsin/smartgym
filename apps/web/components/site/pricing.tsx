"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheck } from "lucide-react";

export type PricingPlan = { key: string; nameFa: string; monthly: string; annual: string; trialDays: number; features: string[]; note: string; featured: boolean };

const fa = (s: string | number) => String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!);
const group = (n: bigint) => fa(n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));

/** Plan cards with a monthly/annual switch. Amounts arrive as rial strings. */
export function Pricing({ plans }: { plans: PricingPlan[] }) {
  const [annual, setAnnual] = useState(false);
  const saving = (() => {
    const p = plans.find((x) => BigInt(x.monthly) > 0n);
    if (!p) return 0;
    const full = BigInt(p.monthly) * 12n;
    return full > 0n ? Number(((full - BigInt(p.annual)) * 100n) / full) : 0;
  })();
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[230px_1fr]">
      <div className="space-y-3">
        <span className="chip-brand">پلن‌های اشتراک</span>
        <h2 id="p-t" className="text-2xl font-black leading-snug">انتخاب پلن مناسب برای باشگاه شما</h2>
        <p className="text-sm leading-7 text-ink-2">با پلن‌های منعطف و قیمت‌های رقابتی، بهترین گزینه را برای باشگاه خود انتخاب کنید.</p>
        <div className="flex items-center gap-2 pt-2" role="group" aria-label="دوره‌ی پرداخت">
          <button type="button" aria-pressed={!annual} onClick={() => setAnnual(false)} className={`h-9 rounded-full px-5 text-sm font-bold transition ${!annual ? "bg-brand-600 text-white shadow-sm" : "bg-white text-ink-2 ring-1 ring-line"}`}>ماهانه</button>
          <button type="button" aria-pressed={annual} onClick={() => setAnnual(true)} className={`h-9 rounded-full px-4 text-sm font-bold transition ${annual ? "bg-brand-600 text-white shadow-sm" : "bg-white text-ink-2 ring-1 ring-line"}`}>
            سالانه{saving > 0 && <span className={`mr-1.5 text-xs ${annual ? "text-brand-100" : "text-brand-700"}`}>{fa(saving)}٪ تخفیف</span>}
          </button>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {plans.map((p) => {
          const amount = BigInt(annual ? p.annual : p.monthly) / 10n;
          return (
            <article key={p.key} className={`relative flex flex-col rounded-2xl bg-white p-5 text-center shadow-sm ${p.featured ? "ring-2 ring-brand-600 sm:-my-3 sm:py-8" : "ring-1 ring-line"}`}>
              {p.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">محبوب‌ترین</span>}
              <h3 className="text-lg font-extrabold">{p.nameFa}</h3>
              <p className="mt-1 text-xs text-ink-3">{p.note}</p>
              <p className="mt-4 text-3xl font-black tracking-tight">{group(amount)}</p>
              <p className="mt-1 text-xs text-ink-2">تومان / {annual ? "سال" : "ماه"}</p>
              <ul className="mt-5 flex-1 space-y-2.5 text-right text-sm">
                {p.features.map((f) => <li key={f} className="flex items-center gap-2"><CircleCheck className="size-4 flex-none text-brand-600" aria-hidden />{f}</li>)}
              </ul>
              <Link href="/login" className={`mt-6 ${p.featured ? "btn-primary" : "btn-secondary"}`}>{p.trialDays > 0 ? `${fa(p.trialDays)} روز رایگان امتحان کنید` : "انتخاب پلن"}</Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
