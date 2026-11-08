import Link from "next/link";
import { cookies } from "next/headers";
import { Dumbbell, Instagram, Mail, MapPin, Phone, Send, ArrowLeft } from "lucide-react";
import type { PlatformSettings } from "@smartgym/validation";

function Brand({ dark }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex size-9 items-center justify-center rounded-[10px] bg-brand-500 text-white"><Dumbbell className="size-5" aria-hidden /></span>
      <span className={`text-lg font-black ${dark ? "text-white" : "text-ink"}`}>اسمارت‌جیم</span>
    </span>
  );
}

const NAV: [string, string][] = [["/", "صفحه اصلی"], ["/#features", "امکانات"], ["/#pricing", "قیمت‌ها"], ["/blog", "وبلاگ"], ["/#faq", "سوالات"]];

export async function SiteHeader({ cta, dark }: { cta: string; dark?: boolean }) {
  const signedIn = (await cookies()).has("sg_session");
  return (
    <header className={dark ? "relative z-20" : "sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur"}>
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-4">
        <Link href="/" aria-label="صفحه‌ی اصلی"><Brand dark={dark} /></Link>
        <nav aria-label="منوی اصلی" className={`hidden gap-7 text-sm font-semibold md:flex ${dark ? "text-white/80" : "text-ink-2"}`}>
          {NAV.map(([href, label], i) => (
            <Link key={href} href={href} className={`${dark ? "hover:text-white" : "hover:text-ink"} ${i === 0 && dark ? "border-b-2 border-brand-500 pb-1 text-brand-500" : ""}`}>{label}</Link>
          ))}
        </nav>
        {signedIn ? (
          <Link href="/manager" className="btn-primary h-10 rounded-full">ورود به پنل</Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className={`btn hidden h-10 rounded-full px-5 text-sm sm:inline-flex ${dark ? "text-white ring-1 ring-white/50 hover:bg-white/10" : "text-ink ring-1 ring-line hover:bg-canvas"}`}>ورود</Link>
            <Link href="/login" className="btn h-10 gap-1.5 rounded-full bg-brand-500 px-5 text-sm text-white hover:bg-brand-600">{cta}<ArrowLeft className="size-4" aria-hidden /></Link>
          </div>
        )}
      </div>
    </header>
  );
}

export function SiteFooter({ site }: { site: PlatformSettings["site"] }) {
  const hasContact = site.supportPhone || site.supportEmail || site.address;
  return (
    <footer id="contact" className="bg-[#07130d] text-white/75">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <Brand dark />
          <p className="text-sm">{site.tagline}</p>
        </div>
        <nav aria-label="پیوندها" className="space-y-2.5 text-sm">
          <p className="font-bold text-white">دسترسی سریع</p>
          {NAV.map(([href, label]) => <Link key={href} href={href} className="block hover:text-white">{label}</Link>)}
          <Link href="/login" className="block hover:text-white">ورود به پنل</Link>
        </nav>
        <div className="space-y-2.5 text-sm">
          <p className="font-bold text-white">تماس با ما</p>
          {site.supportPhone && <p className="flex items-center gap-2"><Phone className="size-4 text-brand-500" aria-hidden /><a href={`tel:${site.supportPhone}`} dir="ltr" className="hover:text-white">{site.supportPhone}</a></p>}
          {site.supportEmail && <p className="flex items-center gap-2"><Mail className="size-4 text-brand-500" aria-hidden /><a href={`mailto:${site.supportEmail}`} dir="ltr" className="hover:text-white">{site.supportEmail}</a></p>}
          {site.address && <p className="flex items-center gap-2"><MapPin className="size-4 flex-none text-brand-500" aria-hidden />{site.address}</p>}
          {!hasContact && <p>از طریق تیکت داخل پنل با ما در تماس باشید.</p>}
          {site.enamadId && site.enamadCode && (
            <a referrerPolicy="origin" target="_blank" rel="noopener" href={`https://trustseal.enamad.ir/?id=${site.enamadId}&Code=${site.enamadCode}`} className="mt-3 inline-block rounded-xl bg-white p-1.5" aria-label="نماد اعتماد الکترونیکی">
              {/* eslint-disable-next-line @next/next/no-img-element -- e-Namad requires its own hosted image */}
              <img referrerPolicy="origin" src={`https://trustseal.enamad.ir/logo.aspx?id=${site.enamadId}&Code=${site.enamadCode}`} alt="نماد اعتماد الکترونیکی" className="h-20 w-auto cursor-pointer" />
            </a>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs">
          <div className="space-y-1">
            <p>© {new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric" }).format(new Date())} تمامی حقوق برای {site.name} محفوظ است.</p>
            <p>طراحی و توسعه توسط شرکت <a href="https://dot-web.ir" target="_blank" rel="noopener" className="font-bold text-white hover:text-brand-500">دات وب</a></p>
          </div>
          <div className="flex gap-4">
            {site.telegram && <a href={`https://t.me/${site.telegram.replace(/^@/, "")}`} rel="noopener noreferrer" target="_blank" aria-label="تلگرام" className="hover:text-white"><Send className="size-5" /></a>}
            {site.instagram && <a href={`https://instagram.com/${site.instagram.replace(/^@/, "")}`} rel="noopener noreferrer" target="_blank" aria-label="اینستاگرام" className="hover:text-white"><Instagram className="size-5" /></a>}
          </div>
        </div>
      </div>
    </footer>
  );
}
