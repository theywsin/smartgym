import Link from "next/link";
import { cookies } from "next/headers";
import type { PlatformSettings } from "@smartgym/validation";
import { Logo } from "@/components/logo";

export async function SiteHeader({ cta }: { cta: string }) {
  const signedIn = (await cookies()).has("sg_session");
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-4 py-3">
        <Link href="/" aria-label="صفحه‌ی اصلی"><Logo /></Link>
        <nav aria-label="منوی اصلی" className="hidden gap-6 text-sm font-semibold text-ink-2 sm:flex">
          <Link href="/#features" className="hover:text-ink">امکانات</Link>
          <Link href="/#pricing" className="hover:text-ink">قیمت‌ها</Link>
          <Link href="/blog" className="hover:text-ink">مقالات</Link>
          <Link href="/#faq" className="hover:text-ink">پرسش‌ها</Link>
        </nav>
        {signedIn ? (
          <Link href="/manager" className="btn-primary h-10">ورود به پنل</Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost h-10 text-sm">ورود</Link>
            <Link href="/login" className="btn-primary h-10 text-sm">{cta}</Link>
          </div>
        )}
      </div>
    </header>
  );
}

export function SiteFooter({ site }: { site: PlatformSettings["site"] }) {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-[1120px] gap-8 px-4 py-10 sm:grid-cols-3">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-ink-2">{site.tagline}</p>
        </div>
        <nav aria-label="پیوندها" className="space-y-2 text-sm">
          <p className="font-bold">پیوندها</p>
          <Link href="/blog" className="block text-ink-2 hover:text-ink">مقالات</Link>
          <Link href="/#pricing" className="block text-ink-2 hover:text-ink">قیمت‌ها</Link>
          <Link href="/login" className="block text-ink-2 hover:text-ink">ورود به پنل</Link>
        </nav>
        <div className="space-y-2 text-sm">
          <p className="font-bold">تماس با ما</p>
          {site.supportPhone && <p className="text-ink-2">تلفن: <a href={`tel:${site.supportPhone}`} className="ltr-nums" dir="ltr">{site.supportPhone}</a></p>}
          {site.supportEmail && <p className="text-ink-2">ایمیل: <a href={`mailto:${site.supportEmail}`} dir="ltr">{site.supportEmail}</a></p>}
          {site.address && <p className="text-ink-2">{site.address}</p>}
          <div className="flex gap-3">
            {site.instagram && <a href={`https://instagram.com/${site.instagram.replace(/^@/, "")}`} rel="noopener noreferrer" target="_blank" className="text-ink-2 hover:text-ink">اینستاگرام</a>}
            {site.telegram && <a href={`https://t.me/${site.telegram.replace(/^@/, "")}`} rel="noopener noreferrer" target="_blank" className="text-ink-2 hover:text-ink">تلگرام</a>}
          </div>
        </div>
      </div>
      <p className="border-t border-line py-4 text-center text-xs text-ink-3">© {new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric" }).format(new Date())} {site.name}</p>
    </footer>
  );
}
