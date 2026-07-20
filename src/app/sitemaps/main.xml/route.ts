import { createSitemapResponse } from "@/lib/seo/sitemap-response";

export const revalidate = 3600;
export const maxDuration = 60;

/** Alternate sitemap URL for GSC when /sitemap.xml is stuck on a cached fetch error. */
export async function GET() {
  return createSitemapResponse();
}
