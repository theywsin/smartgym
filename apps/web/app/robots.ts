import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/server/deps";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/blog"], disallow: ["/manager", "/admin", "/athlete", "/api", "/pay", "/onboarding", "/select-gym"] },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
