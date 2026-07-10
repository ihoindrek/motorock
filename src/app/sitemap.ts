import type { MetadataRoute } from "next";
import { isSiteIndexable } from "@/lib/site-indexing";
import { buildSitemap } from "@/lib/seo/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSiteIndexable()) {
    return [];
  }

  return buildSitemap();
}
