import { createSitemapResponse } from "@/lib/seo/sitemap-response";

export const revalidate = 3600;
export const maxDuration = 60;

export async function GET() {
  return createSitemapResponse();
}
