import type { MetadataRoute } from "next";
import { isSiteIndexable } from "@/lib/site-indexing";
import { buildSitemap } from "@/lib/seo/sitemap";

/** Regenerate sitemap at most once per hour even without a webhook. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSiteIndexable()) {
    return [];
  }

  return buildSitemap();
}
