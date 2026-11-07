import type { MetadataRoute } from "next";
import { listPublishedArticles } from "@smartgym/core";
import { appUrl, coreDeps } from "@/lib/server/deps";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const { items } = await listPublishedArticles(coreDeps(), { page: 1, pageSize: 1000 });
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/blog`, changeFrequency: "daily", priority: 0.8 },
    ...items.map((a) => ({ url: `${base}/blog/${a.slug}`, lastModified: a.publishedAt ?? undefined, priority: 0.6 })),
  ];
}
