import type { Metadata } from "next";
import { connection } from "next/server";
import "@fontsource-variable/vazirmatn";
import "./globals.css";
import { getPlatformSettings } from "@smartgym/core";
import type { PlatformSettings } from "@smartgym/validation";
import { Providers } from "@/components/providers";
import { appUrl, coreDeps } from "@/lib/server/deps";

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  let name = "اسمارت‌جیم";
  let description = "پلتفرم هوشمند مدیریت باشگاه‌های ورزشی";
  let favicon = "";
  try {
    const s = await getPlatformSettings(coreDeps());
    name = s.site.name || name;
    description = s.site.tagline || description;
    favicon = s.site.faviconUrl || s.site.logoUrl || "";
  } catch { /* defaults */ }
  return {
    metadataBase: new URL(appUrl()),
    title: { default: name, template: `%s · ${name}` },
    description,
    ...(favicon ? { icons: { icon: favicon, apple: favicon } } : {}),
  };
}

const FALLBACK = `"Vazirmatn Variable", "Vazirmatn", Tahoma, sans-serif`;
const PEYDA_WEIGHTS: [string, number][] = [["Regular", 400], ["Medium", 500], ["Bold", 700], ["Black", 900]];

/** @font-face rules and the --font-sans value for the font picked in the platform admin. */
function fontCss(a: PlatformSettings["appearance"] | undefined): { css: string; family: string } {
  if (a?.font === "peyda") {
    const css = PEYDA_WEIGHTS.map(([n, w]) => `@font-face{font-family:"Peyda";src:url("/fonts/peyda/Peyda-${n}.woff2") format("woff2");font-weight:${w};font-display:swap}`).join("");
    return { css, family: `"Peyda", ${FALLBACK}` };
  }
  // Values were validated on save (name: [A-Za-z0-9 _-], url: https or /fonts/ path with a font extension).
  if (a?.font === "custom" && a.customFontName && a.customFontUrl) {
    const fmt = a.customFontUrl.endsWith(".woff2") ? "woff2" : a.customFontUrl.endsWith(".woff") ? "woff" : a.customFontUrl.endsWith(".otf") ? "opentype" : "truetype";
    return { css: `@font-face{font-family:"${a.customFontName}";src:url("${a.customFontUrl}") format("${fmt}");font-weight:100 900;font-display:swap}`, family: `"${a.customFontName}", ${FALLBACK}` };
  }
  return { css: "", family: FALLBACK };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The font comes from the database, so render per request (never baked in at build time).
  await connection();
  let appearance: PlatformSettings["appearance"] | undefined;
  try {
    appearance = (await getPlatformSettings(coreDeps())).appearance;
  } catch {
    appearance = undefined; // DB or env not available: fall back to Vazirmatn
  }
  const font = fontCss(appearance);
  return (
    <html lang="fa" dir="rtl" style={{ ["--font-sans" as string]: font.family }}>
      <head>{font.css ? <style dangerouslySetInnerHTML={{ __html: font.css }} /> : null}</head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
