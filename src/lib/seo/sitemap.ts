import type { MetadataRoute } from "next";
import { locales, type Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import {
  fetchEquipmentCategoryIndex,
  EQUIPMENT_ROOT_SLUGS,
  type EquipmentCategoryIndex,
  type WcCategoryEntry,
} from "@/lib/graphql/categories";
import { getBlogSitemapEntries } from "@/lib/blog/posts";
import { graphqlRequest } from "@/lib/graphql/client";
import { PRODUCT_CATALOG_PAGE } from "@/lib/graphql/queries";
import type { GraphQLProductCard } from "@/lib/graphql/types";
import { buildProductSlugAlternates } from "@/lib/graphql/wpml";
import {
  buildLanguageAlternates,
  resolveLocalizedPath,
} from "@/lib/seo/metadata";
import { PRODUCT_SLUG_PATH_TEMPLATES } from "@/lib/shop/product-url";
import { getStorefrontUrl } from "@/lib/storefront/url";
import { EQUIPMENT_BRAND_SLUGS } from "@/lib/shop/brand-catalog-url";
import { buildBrandCatalogHref } from "@/lib/shop/brand-url";
import { buildEquipmentCategoryHrefFromNodes } from "@/lib/shop/equipment-route";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";
import {
  buildShopCategoryHref,
  buildToolsCategoryHref,
  isStandaloneShopCategory,
} from "@/lib/shop/shop-category-route";

const STATIC_PATHS = [
  "/",
  "/about",
  "/contact",
  "/blog",
  "/shop/motorcycles",
  "/shop/tools",
  "/shipping",
  "/privacy",
  "/terms",
  "/returns",
  "/support",
  "/cookies",
  "/test-ride",
] as const;

type CatalogPageResponse = {
  products: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    nodes: GraphQLProductCard[];
  };
};

function absoluteUrl(path: string) {
  return `${getStorefrontUrl()}${path}`;
}

function buildPathAlternates(
  pathAlternates: Partial<Record<Locale, string>>,
) {
  const languages: Record<string, string> = {};

  for (const locale of locales) {
    const path = pathAlternates[locale];
    if (path) {
      languages[locale] = absoluteUrl(localizedHref(locale, path));
    }
  }

  if (languages.en) {
    languages["x-default"] = languages.en;
  }

  return languages;
}

function sitemapEntry(
  pathname: string,
  options?: {
    locale?: Locale;
    pathAlternates?: Partial<Record<Locale, string>>;
    slugAlternates?: Partial<Record<Locale, string>>;
    slugPathTemplate?: string | Partial<Record<Locale, string>>;
    lastModified?: Date;
  },
): MetadataRoute.Sitemap[number] {
  const locale = options?.locale ?? "en";
  const languages = options?.pathAlternates
    ? buildPathAlternates(options.pathAlternates)
    : buildLanguageAlternates(
        pathname,
        options?.slugAlternates,
        options?.slugPathTemplate,
      );

  const primaryPath = options?.pathAlternates?.[locale]
    ? localizedHref(locale, options.pathAlternates[locale] as string)
    : resolveLocalizedPath(
        locale,
        pathname,
        options?.slugAlternates,
        options?.slugPathTemplate,
      );

  return {
    url: absoluteUrl(primaryPath),
    lastModified: options?.lastModified,
    alternates: {
      languages,
    },
  };
}

type CatalogPageVariables = {
  first: number;
  after: string | null;
  category: string | null;
  categoryNotIn: string[] | null;
};

async function fetchAllProductCards(): Promise<GraphQLProductCard[]> {
  const nodes: GraphQLProductCard[] = [];
  let after: string | null = null;

  for (;;) {
    const variables: CatalogPageVariables = {
      first: 100,
      after,
      category: null,
      categoryNotIn: null,
    };
    const data = await graphqlRequest<CatalogPageResponse, CatalogPageVariables>(
      PRODUCT_CATALOG_PAGE,
      variables,
    );

    nodes.push(...data.products.nodes);

    if (!data.products.pageInfo.hasNextPage) {
      break;
    }

    after = data.products.pageInfo.endCursor;
  }

  return nodes;
}

function collectEquipmentCategoryPaths(
  locale: Locale,
  index: EquipmentCategoryIndex,
) {
  const paths = new Set<string>();

  const walk = (node: WcCategoryEntry, chain: WcCategoryEntry[]) => {
    const fullChain = [...chain, node];
    paths.add(buildEquipmentCategoryHrefFromNodes(fullChain, locale));

    for (const child of index.nodes.values()) {
      if (child.parentSlug === node.slug) {
        walk(child, fullChain);
      }
    }
  };

  for (const rootSlug of EQUIPMENT_ROOT_SLUGS) {
    const root = index.nodes.get(rootSlug);

    if (root) {
      walk(root, []);
    }
  }

  return [...paths];
}

function collectCategoryPaths(
  locale: Locale,
  index: Awaited<ReturnType<typeof fetchEquipmentCategoryIndex>>,
) {
  if (!index) {
    return [] as string[];
  }

  const paths = new Set<string>();

  paths.add(buildEquipmentHubHref(locale));
  paths.add(buildToolsCategoryHref(locale));

  for (const path of collectEquipmentCategoryPaths(locale, index)) {
    paths.add(path);
  }

  for (const node of index.nodes.values()) {
    if (isStandaloneShopCategory(node, index)) {
      paths.add(buildShopCategoryHref(node, locale));
    }
  }

  return [...paths];
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatLastmod(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  // Date-only W3C format — more compatible with picky sitemap consumers.
  return date.toISOString().slice(0, 10);
}

/** Serialize sitemap entries to XML (Route Handler; not Next metadata convention). */
export function renderSitemapXml(entries: MetadataRoute.Sitemap) {
  const body = entries
    .map((entry) => {
      const lines = [`<url>`, `<loc>${escapeXml(entry.url)}</loc>`];

      const languages = entry.alternates?.languages;
      if (languages) {
        for (const [hreflang, href] of Object.entries(languages)) {
          if (!href) {
            continue;
          }
          lines.push(
            `<xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}" />`,
          );
        }
      }

      if (entry.lastModified) {
        const lastmod = formatLastmod(entry.lastModified);
        if (lastmod) {
          lines.push(`<lastmod>${lastmod}</lastmod>`);
        }
      }

      lines.push(`</url>`);
      return lines.join("\n");
    })
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    body,
    `</urlset>`,
    ``,
  ].join("\n");
}

export async function buildStaticSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // No lastModified for static/category pages — a fake "always today" date
  // teaches crawlers to ignore the signal entirely.
  for (const path of STATIC_PATHS) {
    entries.push(sitemapEntry(path));
  }

  for (const brand of EQUIPMENT_BRAND_SLUGS) {
    entries.push(
      sitemapEntry(buildBrandCatalogHref("en", brand), {
        pathAlternates: {
          en: buildBrandCatalogHref("en", brand),
          et: buildBrandCatalogHref("et", brand),
        },
      }),
    );
  }

  return entries;
}

export async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await buildStaticSitemapEntries();

  // Prefer a partial (but valid) sitemap over a 500 when shop.motorock.eu drops sockets.
  const [productsResult, blogResult, enCategoryResult, etCategoryResult] =
    await Promise.allSettled([
      fetchAllProductCards(),
      getBlogSitemapEntries(),
      fetchEquipmentCategoryIndex("en"),
      fetchEquipmentCategoryIndex("et"),
    ]);

  const products =
    productsResult.status === "fulfilled" ? productsResult.value : [];
  const blogEntries =
    blogResult.status === "fulfilled" ? blogResult.value : [];
  const enCategoryIndex =
    enCategoryResult.status === "fulfilled" ? enCategoryResult.value : null;
  const etCategoryIndex =
    etCategoryResult.status === "fulfilled" ? etCategoryResult.value : null;

  for (const result of [
    productsResult,
    blogResult,
    enCategoryResult,
    etCategoryResult,
  ]) {
    if (result.status === "rejected") {
      console.error("[sitemap] partial GraphQL failure:", result.reason);
    }
  }

  for (const locale of locales) {
    const categoryIndex = locale === "en" ? enCategoryIndex : etCategoryIndex;

    for (const path of collectCategoryPaths(locale, categoryIndex)) {
      entries.push(sitemapEntry(path, { locale }));
    }
  }

  for (const blogEntry of blogEntries) {
    entries.push(
      sitemapEntry("/blog/post", {
        slugAlternates: blogEntry.slugAlternates,
        slugPathTemplate: "/blog/{slug}",
        lastModified: blogEntry.lastModified,
      }),
    );
  }

  for (const product of products) {
    const slugAlternates = buildProductSlugAlternates(product);
    const primarySlug = slugAlternates.en ?? slugAlternates.et;

    if (!primarySlug) {
      continue;
    }

    const modified = product.modified ?? product.date;
    const lastModified = modified ? new Date(modified) : undefined;

    entries.push(
      sitemapEntry("/product/item", {
        slugAlternates,
        slugPathTemplate: PRODUCT_SLUG_PATH_TEMPLATES,
        lastModified:
          lastModified && !Number.isNaN(lastModified.getTime())
            ? lastModified
            : undefined,
      }),
    );
  }

  return entries;
}
