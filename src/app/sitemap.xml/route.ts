import { createSitemapResponse } from "@/lib/seo/sitemap-response";

/** Skip build-time prerender — full catalog fetch can exceed the 60s build limit. */
export const dynamic = "force-dynamic";
export const revalidate = 3600;
export const maxDuration = 120;

export async function GET() {
  return createSitemapResponse();
}
