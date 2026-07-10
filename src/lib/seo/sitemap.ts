import type { MetadataRoute } from "next";
import type { Locale } from "@/i18n/config";
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

function sitemapEntry(
  pathname: string,
  options?: {
    slugAlternates?: Partial<Record<Locale, string>>;
    slugPathTemplate?: string | Partial<Record<Locale, string>>;
    lastModified?: Date;
  },
): MetadataRoute.Sitemap[number] {
  const languages = buildLanguageAlternates(
    pathname,
    options?.slugAlternates,
    options?.slugPathTemplate,
  );

  return {
    url: absoluteUrl(
      resolveLocalizedPath(
        "en",
        pathname,
        options?.slugAlternates,
        options?.slugPathTemplate,
      ),
    ),
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

export async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const path of STATIC_PATHS) {
    entries.push(sitemapEntry(path, { lastModified: now }));
  }

  for (const brand of EQUIPMENT_BRAND_SLUGS) {
    entries.push(
      sitemapEntry(buildBrandCatalogHref("en", brand), { lastModified: now }),
    );
    entries.push(
      sitemapEntry(buildBrandCatalogHref("et", brand), { lastModified: now }),
    );
  }

  const [products, blogEntries, enCategoryIndex, etCategoryIndex] =
    await Promise.all([
      fetchAllProductCards(),
      getBlogSitemapEntries(),
      fetchEquipmentCategoryIndex("en"),
      fetchEquipmentCategoryIndex("et"),
    ]);

  const categoryPaths = new Set([
    ...collectCategoryPaths("en", enCategoryIndex),
    ...collectCategoryPaths("et", etCategoryIndex),
  ]);

  for (const path of categoryPaths) {
    entries.push(sitemapEntry(path, { lastModified: now }));
  }

  for (const slugAlternates of blogEntries) {
    entries.push(
      sitemapEntry("/blog/post", {
        slugAlternates,
        slugPathTemplate: "/blog/{slug}",
        lastModified: now,
      }),
    );
  }

  for (const product of products) {
    const slugAlternates = buildProductSlugAlternates(product);
    const primarySlug = slugAlternates.en ?? slugAlternates.et;

    if (!primarySlug) {
      continue;
    }

    entries.push(
      sitemapEntry("/product/item", {
        slugAlternates,
        slugPathTemplate: PRODUCT_SLUG_PATH_TEMPLATES,
        lastModified: now,
      }),
    );
  }

  return entries;
}
