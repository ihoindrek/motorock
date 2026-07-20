import { unstable_cache } from "next/cache";
import { isSiteIndexable } from "@/lib/site-indexing";
import {
  buildSitemap,
  buildStaticSitemapEntries,
  renderSitemapXml,
} from "@/lib/seo/sitemap";

export const SITEMAP_REVALIDATE_SECONDS = 3600;

const EMPTY_SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>
`;

const getCachedSitemapXml = unstable_cache(
  async () => renderSitemapXml(await buildSitemap()),
  ["motorock-sitemap-xml-v1"],
  {
    revalidate: SITEMAP_REVALIDATE_SECONDS,
    tags: ["sitemap", "woocommerce"],
  },
);

function xmlResponse(xml: string, maxAge = SITEMAP_REVALIDATE_SECONDS) {
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, s-maxage=${maxAge}, stale-while-revalidate=86400`,
    },
  });
}

/** Shared sitemap HTTP response for /sitemap.xml and /sitemaps/main.xml. */
export async function createSitemapResponse() {
  if (!isSiteIndexable()) {
    return xmlResponse(EMPTY_SITEMAP_XML, 300);
  }

  try {
    return xmlResponse(await getCachedSitemapXml());
  } catch (error) {
    console.error("[sitemap] build failed, serving static fallback:", error);

    try {
      return xmlResponse(
        renderSitemapXml(await buildStaticSitemapEntries()),
        300,
      );
    } catch (fallbackError) {
      console.error("[sitemap] static fallback failed:", fallbackError);
      return xmlResponse(EMPTY_SITEMAP_XML, 60);
    }
  }
}
