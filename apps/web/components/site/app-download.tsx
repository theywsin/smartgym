import { Download, Smartphone } from "lucide-react";
import type { PlatformSettings } from "@smartgym/validation";

const STORES: [keyof PlatformSettings["landing"]["apps"], string, string][] = [
  ["bazaar", "کافه‌بازار", "دریافت از"],
  ["myket", "مایکت", "دریافت از"],
  ["googlePlay", "Google Play", "دریافت از"],
  ["appStore", "App Store", "دریافت از"],
  ["apk", "فایل APK", "دانلود مستقیم"],
];

/** Landing section with store links. Renders nothing until the admin sets at least one link. */
export function AppDownload({ apps, name }: { apps: PlatformSettings["landing"]["apps"]; name: string }) {
  const links = STORES.filter(([k]) => apps[k]);
  if (!links.length) return null;
  return (
    <section id="apps" className="scroll-mt-20 bg-[#07130d] text-white" aria-labelledby="apps-t">
      <div className="mx-auto grid max-w-[1180px] items-center gap-8 px-4 py-14 lg:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-300"><Smartphone className="size-4" aria-hidden />اپلیکیشن موبایل</span>
          <h2 id="apps-t" className="text-2xl font-black sm:text-3xl">{name} همیشه همراه شما</h2>
          <p className="max-w-xl leading-8 text-white/70">مدیران و ورزشکاران: برنامه‌ی تمرینی، شهریه، حضور و غیاب و پیام‌ها را روی گوشی ببینید.</p>
        </div>
        <ul className="flex flex-wrap gap-3">
          {links.map(([k, label, pre]) => (
            <li key={k}>
              <a href={apps[k]} target="_blank" rel="noopener" className="flex min-w-[160px] items-center gap-3 rounded-xl bg-white px-4 py-2.5 text-ink transition hover:bg-brand-50">
                <Download className="size-5 text-brand-600" aria-hidden />
                <span className="leading-tight"><span className="block text-[11px] text-ink-3">{pre}</span><span className="block font-bold">{label}</span></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
