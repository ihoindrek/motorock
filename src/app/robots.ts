import type { MetadataRoute } from "next";

import { isSiteIndexable } from "@/lib/site-indexing";
import { getStorefrontUrl } from "@/lib/storefront/url";

export default function robots(): MetadataRoute.Robots {
  if (!isSiteIndexable()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  const origin = getStorefrontUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    // Primary + alternate path (GSC often caches failures on /sitemap.xml).
    sitemap: [`${origin}/sitemap.xml`, `${origin}/sitemaps/main.xml`],
  };
}
