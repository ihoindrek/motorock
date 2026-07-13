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

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${getStorefrontUrl()}/sitemap.xml`,
  };
}
