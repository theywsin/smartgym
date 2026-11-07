import type { MetadataRoute } from "next";

/** Installable web app (Add to Home Screen) for members and staff. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "اسمارت‌جیم",
    short_name: "اسمارت‌جیم",
    description: "اشتراک، کد ورود و برنامه‌ی تمرینی شما",
    start_url: "/athlete",
    display: "standalone",
    dir: "rtl",
    lang: "fa",
    background_color: "#f9fafb",
    theme_color: "#16a34a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
