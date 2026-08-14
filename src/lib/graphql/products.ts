import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { Locale } from "@/i18n/config";
import type { CatalogProduct } from "@/types/catalog-product";
import type { MotorcycleProduct } from "@/types/motorcycle-product";
import { pickSimilarProducts, RELATED_PRODUCTS_LIMIT } from "@/lib/shop/similar-products";
import {
  type CategoryRoute,
  resolveEquipmentCatalogWhere,
} from "@/lib/shop/category";
import { TOOLS_WC_SLUG } from "@/lib/shop/wc-categories";
import { graphqlRequest } from "@/lib/graphql/client";
import {
  isGraphqlMotorcycle,
  mapGraphqlCardToCatalogProduct,
  mapGraphqlToCatalogProduct,
  mapGraphqlToMotorcycleProduct,
  variationIdsFromProduct,
} from "@/lib/graphql/map-graphql-product";
import { PRODUCT_BY_SLUG, PRODUCT_BY_DATABASE_ID, HOMEPAGE_PRODUCT_CATALOG_PAGE, PRODUCT_CATALOG_PAGE } from "@/lib/graphql/queries";
import type { GraphQLProduct, GraphQLProductCard } from "@/lib/graphql/types";
import {
  mergeGraphqlProductPricing,
  resolveCatalogPricingNode,
} from "@/lib/graphql/resolve-product-pricing";
import {
  getGraphqlLanguageCode,
  resolveProductSlugForLocale,
  buildProductSlugAlternates,
  selectCatalogNodesForLocale,
  findTranslationDatabaseId,
} from "@/lib/graphql/wpml";
import { fetchWpmlProductSlugAlternates } from "@/lib/graphql/wpml-slug-alternates";
import { isSameProductContent } from "@/lib/graphql/product-content-parity";
import {
  collectShowroomMetaSourcesFromSiblingProducts,
  getShowroomAvailableFromMeta,
  type ShowroomMetaSource,
} from "@/lib/shop/resolve-showroom-available";
import { getIsNewFromMeta } from "@/lib/shop/resolve-is-new";

type ProductBySlugResponse = {
  product: GraphQLProduct | null;
};

type CatalogPageResponse = {
  products: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    nodes: GraphQLProductCard[];
  };
};

type CatalogWhere = {
  category?: string;
  categoryNotIn?: string[];
};

type CatalogPageVariables = {
  first: number;
  after: string | null;
  category: string | null;
  categoryNotIn: string[] | null;
};

const CATALOG_PAGE_SIZE = 100;
const HOMEPAGE_MOTORCYCLE_LIMIT = 36;
const HOMEPAGE_GEAR_LIMIT = 120;
const HOMEPAGE_WOMEN_LIMIT = 200;

type CatalogFetchResult = {
  nodes: GraphQLProductCard[];
  nodesById: Map<number, GraphQLProductCard>;
};

export type HomepageFavoriteCatalogs = {
  motorcycles: CatalogProduct[];
  menEquipment: CatalogProduct[];
  womenEquipment: CatalogProduct[];
  accessoriesEquipment: CatalogProduct[];
};

function indexCatalogNodesById(
  nodes: readonly GraphQLProductCard[],
): Map<number, GraphQLProductCard> {
  const nodesById = new Map<number, GraphQLProductCard>();

  for (const node of nodes) {
    if (node.databaseId) {
      nodesById.set(node.databaseId, node);
    }
  }

  return nodesById;
}

function mergeCatalogNodesById(
  ...groups: readonly (readonly GraphQLProductCard[])[]
): GraphQLProductCard[] {
  const merged = new Map<number, GraphQLProductCard>();

  for (const nodes of groups) {
    for (const node of nodes) {
      if (node.databaseId) {
        merged.set(node.databaseId, node);
      }
    }
  }

  return [...merged.values()];
}

function mergeCatalogNodeMaps(
  ...maps: readonly Map<number, GraphQLProductCard>[]
): Map<number, GraphQLProductCard> {
  const merged = new Map<number, GraphQLProductCard>();

  for (const map of maps) {
    for (const [databaseId, node] of map) {
      merged.set(databaseId, node);
    }
  }

  return merged;
}

function isHomepageCatalogEmpty(catalog: HomepageFavoriteCatalogs) {
  return (
    catalog.motorcycles.length === 0 &&
    catalog.menEquipment.length === 0 &&
    catalog.womenEquipment.length === 0 &&
    catalog.accessoriesEquipment.length === 0
  );
}

function assertHomepageCatalogHasProducts(catalog: HomepageFavoriteCatalogs) {
  if (isHomepageCatalogEmpty(catalog)) {
    throw new Error("[homepage] favorite catalog returned no products");
  }
}

function settledCatalogResult(
  result: PromiseSettledResult<CatalogFetchResult>,
  label: string,
): CatalogFetchResult {
  if (result.status === "fulfilled") {
    return result.value;
  }

  console.error(`[homepage] ${label} catalog fetch failed:`, result.reason);
  return { nodes: [], nodesById: new Map() };
}

async function buildShowroomMetaSourcesForProduct(
  product: GraphQLProduct | GraphQLProductCard,
  locale: Locale,
): Promise<ShowroomMetaSource[]> {
  const sources: ShowroomMetaSource[] = [
    { slug: product.slug, meta: product.metaData, publishedAt: product.date },
  ];

  const fallbackLocale: Locale = locale === "et" ? "en" : "et";
  const translationId = findTranslationDatabaseId(product, fallbackLocale);

  if (translationId) {
    const translation = await fetchGraphqlProductByDatabaseId(translationId);

    if (translation) {
      sources.push({
        slug: translation.slug,
        meta: translation.metaData,
        publishedAt: translation.date,
      });
    }
  }

  return sources;
}

export async function buildCatalogShowroomMetaSourcesMap(
  nodes: readonly GraphQLProductCard[],
  locale: Locale,
): Promise<Map<number, readonly ShowroomMetaSource[]>> {
  const fallbackLocale: Locale = locale === "et" ? "en" : "et";
  const translationIds = new Set<number>();
  const sourcesByProductId = new Map<number, readonly ShowroomMetaSource[]>();

  for (const node of nodes) {
    if (!node.databaseId) {
      continue;
    }

    const translationId = findTranslationDatabaseId(node, fallbackLocale);
    const needsTranslationMeta =
      getShowroomAvailableFromMeta(node.metaData) === null ||
      getIsNewFromMeta(node.metaData) === null;

    if (translationId && needsTranslationMeta) {
      translationIds.add(translationId);
    }
  }

  const translationsById = new Map<number, GraphQLProductCard>();

  await Promise.all(
    [...translationIds].map(async (translationId) => {
      const translation = await fetchGraphqlProductByDatabaseId(translationId);

      if (translation?.databaseId) {
        translationsById.set(translation.databaseId, translation);
      }
    }),
  );

  for (const node of nodes) {
    if (!node.databaseId) {
      continue;
    }

    const sources: ShowroomMetaSource[] = [
      { slug: node.slug, meta: node.metaData, publishedAt: node.date },
    ];
    const translationId = findTranslationDatabaseId(node, fallbackLocale);

    if (translationId) {
      const translation = translationsById.get(translationId);

      if (translation) {
        sources.push({
          slug: translation.slug,
          meta: translation.metaData,
          publishedAt: translation.date,
        });
      }
    }

    sourcesByProductId.set(node.databaseId, sources);
  }

  return sourcesByProductId;
}

function mapCatalogCard(
  node: GraphQLProductCard,
  locale: Locale,
  nodesById: Map<number, GraphQLProductCard>,
  showroomMetaSourcesByProductId?: Map<number, readonly ShowroomMetaSource[]>,
) {
  const pricedNode = resolveCatalogPricingNode(node, nodesById);
  const showroomMetaSources =
    (pricedNode.databaseId
      ? showroomMetaSourcesByProductId?.get(pricedNode.databaseId)
      : undefined) ??
    collectShowroomMetaSourcesFromSiblingProducts(pricedNode, nodesById);

  return mapGraphqlCardToCatalogProduct(pricedNode, locale, {
    showroomMetaSources,
  });
}

async function fetchCatalogNodesLimited(
  where: CatalogWhere,
  locale: Locale,
  maxNodes: number,
): Promise<CatalogFetchResult> {
  const rawNodes: GraphQLProductCard[] = [];
  let after: string | null = null;

  for (;;) {
    const remaining = maxNodes - rawNodes.length;
    if (remaining <= 0) {
      break;
    }

    const variables: CatalogPageVariables = {
      first: Math.min(CATALOG_PAGE_SIZE, remaining),
      after,
      category: where.category ?? null,
      categoryNotIn: where.categoryNotIn ?? null,
    };

    const data = await graphqlRequest<CatalogPageResponse, CatalogPageVariables>(
      HOMEPAGE_PRODUCT_CATALOG_PAGE,
      variables,
    );

    rawNodes.push(...data.products.nodes);

    if (!data.products.pageInfo.hasNextPage || rawNodes.length >= maxNodes) {
      break;
    }

    after = data.products.pageInfo.endCursor;
  }

  return {
    nodes: selectCatalogNodesForLocale(rawNodes, locale),
    nodesById: indexCatalogNodesById(rawNodes),
  };
}

async function fetchAllCatalogNodes(
  where: CatalogWhere,
  locale: Locale,
): Promise<CatalogFetchResult> {
  const rawNodes: GraphQLProductCard[] = [];
  let after: string | null = null;

  for (;;) {
    const variables: CatalogPageVariables = {
      first: CATALOG_PAGE_SIZE,
      after,
      category: where.category ?? null,
      categoryNotIn: where.categoryNotIn ?? null,
    };

    // Paging through the whole catalog is inherently sequential and is by
    // far the most expensive fetch chain (similar products, category pages).
    // A long revalidate is safe: WooCommerce changes purge the "woocommerce"
    // tag via the revalidation webhook, so this TTL is only a fallback.
    const data = await graphqlRequest<CatalogPageResponse, CatalogPageVariables>(
      PRODUCT_CATALOG_PAGE,
      variables,
      { next: { revalidate: 3600 } },
    );

    rawNodes.push(...data.products.nodes);

    if (!data.products.pageInfo.hasNextPage) {
      break;
    }

    after = data.products.pageInfo.endCursor;
  }

  return {
    nodes: selectCatalogNodesForLocale(rawNodes, locale),
    nodesById: indexCatalogNodesById(rawNodes),
  };
}

function mapEquipmentCatalogNodes(
  nodes: GraphQLProductCard[],
  locale: Locale,
  nodesById: Map<number, GraphQLProductCard>,
  showroomMetaSourcesByProductId?: Map<number, readonly ShowroomMetaSource[]>,
): CatalogProduct[] {
  return nodes
    .map((node) =>
      mapCatalogCard(node, locale, nodesById, showroomMetaSourcesByProductId),
    )
    .filter(
      (product) =>
        product.type === "equipment" && product.category !== "tools",
    );
}

function mapToolsCatalogNodes(
  nodes: GraphQLProductCard[],
  locale: Locale,
  nodesById: Map<number, GraphQLProductCard>,
  showroomMetaSourcesByProductId?: Map<number, readonly ShowroomMetaSource[]>,
): CatalogProduct[] {
  return nodes
    .map((node) =>
      mapCatalogCard(node, locale, nodesById, showroomMetaSourcesByProductId),
    )
    .filter((product) => product.category === "tools");
}

function mapCatalogNodesForRoute(
  nodes: GraphQLProductCard[],
  route: CategoryRoute,
  locale: Locale,
  nodesById: Map<number, GraphQLProductCard>,
  showroomMetaSourcesByProductId?: Map<number, readonly ShowroomMetaSource[]>,
): CatalogProduct[] {
  if (route.category === "tools" || route.wcCategorySlug === TOOLS_WC_SLUG) {
    return mapToolsCatalogNodes(
      nodes,
      locale,
      nodesById,
      showroomMetaSourcesByProductId,
    );
  }

  return mapEquipmentCatalogNodes(
    nodes,
    locale,
    nodesById,
    showroomMetaSourcesByProductId,
  );
}

// React.cache dedupes these within a single request: generateMetadata and the
// page render both resolve the same product, and Next's request memoization
// doesn't apply to POST (GraphQL) fetches.
export const fetchGraphqlProductBySlug = cache(async (slug: string) => {
  try {
    const data = await graphqlRequest<ProductBySlugResponse>(PRODUCT_BY_SLUG, {
      slug,
    });
    return data.product;
  } catch {
    return null;
  }
});

export const fetchGraphqlProductByDatabaseId = cache(async (databaseId: number) => {
  try {
    const data = await graphqlRequest<
      ProductBySlugResponse,
      { id: number }
    >(PRODUCT_BY_DATABASE_ID, { id: databaseId });
    return data.product;
  } catch {
    return null;
  }
});

async function fetchEnglishPricingProduct(
  product: GraphQLProduct,
): Promise<GraphQLProduct> {
  if (getGraphqlLanguageCode(product) === "en") {
    return product;
  }

  const englishId = findTranslationDatabaseId(product, "en");
  if (!englishId || englishId === product.databaseId) {
    return product;
  }

  return (await fetchGraphqlProductByDatabaseId(englishId)) ?? product;
}

/** Canonical EN product for Meta catalog ids (one catalog, EN Woo ids). */
async function resolveEnglishCatalogProduct(
  product: GraphQLProduct,
): Promise<GraphQLProduct> {
  const fromTranslation = await fetchEnglishPricingProduct(product);
  if (getGraphqlLanguageCode(fromTranslation) === "en") {
    return fromTranslation;
  }

  const englishSlug = resolveProductSlugForLocale(product, "en");
  if (englishSlug) {
    const bySlug = await fetchGraphqlProductBySlug(englishSlug);
    if (bySlug && getGraphqlLanguageCode(bySlug) === "en") {
      return bySlug;
    }
  }

  return fromTranslation;
}

async function buildMetaCatalogVariationIds(
  englishProduct: GraphQLProduct,
): Promise<Readonly<Record<string, number>> | undefined> {
  if (englishProduct.__typename === "VariableProduct") {
    const fromGraphql = variationIdsFromProduct(englishProduct);
    if (fromGraphql) {
      return fromGraphql;
    }
  }

  const englishId = englishProduct.databaseId;
  if (!englishId) {
    return undefined;
  }

  const { fetchStoreProduct, buildVariationIdsFromStoreProduct } = await import(
    "@/lib/woocommerce/store-api-product"
  );
  const storeProduct = await fetchStoreProduct(englishId);
  if (!storeProduct) {
    return undefined;
  }

  return buildVariationIdsFromStoreProduct(storeProduct);
}

async function fetchLocalizedGraphqlProduct(
  slug: string,
  locale: Locale,
): Promise<GraphQLProduct | null> {
  const remote = await fetchGraphqlProductBySlug(slug);

  if (!remote) {
    return null;
  }

  let localized: GraphQLProduct | null = null;

  if (getGraphqlLanguageCode(remote) === locale) {
    localized = remote;
  } else {
    const translationId = findTranslationDatabaseId(remote, locale);

    if (translationId) {
      const translated = await fetchGraphqlProductByDatabaseId(translationId);

      if (translated && getGraphqlLanguageCode(translated) === locale) {
        localized = translated;
      }
    }

    if (!localized) {
      const translatedSlug = resolveProductSlugForLocale(remote, locale);

      if (translatedSlug && translatedSlug !== slug) {
        const translated = await fetchGraphqlProductBySlug(translatedSlug);

        if (translated && getGraphqlLanguageCode(translated) === locale) {
          localized = translated;
        }
      }
    }

    if (!localized && locale === "et" && getGraphqlLanguageCode(remote) === "en") {
      localized = remote;
    }

    // WPML sometimes omits languageCode/translations on variable-product translations.
    // Slug lookup already resolved the correct post — trust it.
    if (!localized && !getGraphqlLanguageCode(remote)) {
      localized = remote;
    }
  }

  if (!localized) {
    return null;
  }

  const pricingSource = await fetchEnglishPricingProduct(localized);
  return mergeGraphqlProductPricing(localized, pricingSource);
}

async function attachMetaCatalogIds(
  product: CatalogProduct,
  englishProduct: GraphQLProduct,
): Promise<CatalogProduct> {
  const metaCatalogProductId = englishProduct.databaseId;
  const metaCatalogVariationIds =
    await buildMetaCatalogVariationIds(englishProduct);

  return {
    ...product,
    metaCatalogProductId,
    metaCatalogVariationIds,
  };
}

export async function getProductBySlugForLocale(
  slug: string,
  locale: Locale,
): Promise<CatalogProduct | undefined> {
  const remote = await fetchLocalizedGraphqlProduct(slug, locale);

  if (!remote) {
    return undefined;
  }

  const showroomMetaSources = await buildShowroomMetaSourcesForProduct(
    remote,
    locale,
  );

  const mapped = mapGraphqlToCatalogProduct(remote, locale, {
    showroomMetaSources,
  });

  const { enrichCatalogProductVariations } = await import(
    "@/lib/woocommerce/store-api-product"
  );

  const englishRemote = await resolveEnglishCatalogProduct(remote);
  const enriched = await enrichCatalogProductVariations(mapped);

  return attachMetaCatalogIds(enriched, englishRemote);
}

async function withMotorcycleCategoryFallback(
  product: GraphQLProduct,
  locale: Locale,
): Promise<GraphQLProduct> {
  if (isGraphqlMotorcycle(product)) {
    return product;
  }

  if (locale !== "et") {
    return product;
  }

  const englishId = findTranslationDatabaseId(product, "en");
  if (!englishId || englishId === product.databaseId) {
    return product;
  }

  const english = await fetchGraphqlProductByDatabaseId(englishId);
  if (!english || !isGraphqlMotorcycle(english)) {
    return product;
  }

  return {
    ...product,
    productCategories: english.productCategories,
  };
}

export async function getMotorcycleProductBySlug(
  slug: string,
  locale: Locale = "en",
): Promise<MotorcycleProduct | null> {
  const remote = await fetchLocalizedGraphqlProduct(slug, locale);

  if (!remote) {
    return null;
  }

  const productForMapping = await withMotorcycleCategoryFallback(remote, locale);

  if (!isGraphqlMotorcycle(productForMapping)) {
    return null;
  }

  let contentUntranslated = false;

  if (locale === "et") {
    const englishId = findTranslationDatabaseId(productForMapping, "en");
    const english = englishId
      ? await fetchGraphqlProductByDatabaseId(englishId)
      : null;

    if (
      english &&
      isGraphqlMotorcycle(english) &&
      isSameProductContent(english, remote)
    ) {
      contentUntranslated = true;
    }
  }

  const showroomMetaSources = await buildShowroomMetaSourcesForProduct(
    productForMapping,
    locale,
  );

  return mapGraphqlToMotorcycleProduct(productForMapping, locale, {
    contentUntranslated,
    showroomMetaSources,
  });
}

export async function getProductBySlug(
  slug: string,
  locale: Locale = "en",
): Promise<CatalogProduct | undefined> {
  return getProductBySlugForLocale(slug, locale);
}

export async function getProductSlugAlternates(
  slug: string,
): Promise<Partial<Record<Locale, string>>> {
  const remote = await fetchGraphqlProductBySlug(slug);

  if (!remote) {
    return {};
  }

  const alternates = buildProductSlugAlternates(remote);

  if (alternates.en && alternates.et) {
    return alternates;
  }

  const wpmlAlternates = await fetchWpmlProductSlugAlternates(remote.databaseId);

  return {
    ...alternates,
    ...wpmlAlternates,
  };
}

async function fetchHomepageFavoriteCatalogsUncached(
  locale: Locale,
): Promise<HomepageFavoriteCatalogs> {
  // Motorcycles first so a partial WP timeout still yields the hero catalog block.
  const motorcyclesResult = await fetchCatalogNodesLimited(
    { category: "motorcycles" },
    locale,
    HOMEPAGE_MOTORCYCLE_LIMIT,
  );

  const [menResult, womenResult, accessoriesResult, helmetsResult] =
    await Promise.allSettled([
      fetchCatalogNodesLimited({ category: "for-men" }, locale, HOMEPAGE_GEAR_LIMIT),
      fetchCatalogNodesLimited(
        { category: "for-women" },
        locale,
        HOMEPAGE_WOMEN_LIMIT,
      ),
      fetchCatalogNodesLimited(
        { category: "accessories" },
        locale,
        HOMEPAGE_GEAR_LIMIT,
      ),
      fetchCatalogNodesLimited({ category: "helmets" }, locale, HOMEPAGE_GEAR_LIMIT),
    ]).then((results) =>
      results.map((result, index) =>
        settledCatalogResult(
          result,
          ["men", "women", "accessories", "helmets"][index] ?? "gear",
        ),
      ),
    );

  const accessoriesNodes = mergeCatalogNodesById(
    accessoriesResult.nodes,
    helmetsResult.nodes,
  );
  const accessoriesNodesById = mergeCatalogNodeMaps(
    accessoriesResult.nodesById,
    helmetsResult.nodesById,
  );

  const catalog: HomepageFavoriteCatalogs = {
    motorcycles: motorcyclesResult.nodes.map((node) =>
      mapCatalogCard(node, locale, motorcyclesResult.nodesById),
    ),
    menEquipment: mapEquipmentCatalogNodes(
      menResult.nodes,
      locale,
      menResult.nodesById,
    ),
    womenEquipment: mapEquipmentCatalogNodes(
      womenResult.nodes,
      locale,
      womenResult.nodesById,
    ),
    accessoriesEquipment: mapEquipmentCatalogNodes(
      accessoriesNodes,
      locale,
      accessoriesNodesById,
    ),
  };

  assertHomepageCatalogHasProducts(catalog);
  return catalog;
}

const getHomepageFavoriteCatalogsEn = unstable_cache(
  () => fetchHomepageFavoriteCatalogsUncached("en"),
  ["homepage-favorite-catalogs", "en", "v2"],
  { revalidate: 300, tags: ["woocommerce", "homepage-en"] },
);

const getHomepageFavoriteCatalogsEt = unstable_cache(
  () => fetchHomepageFavoriteCatalogsUncached("et"),
  ["homepage-favorite-catalogs", "et", "v2"],
  { revalidate: 300, tags: ["woocommerce", "homepage-et"] },
);

const homepageFavoriteCatalogsByLocale = {
  en: getHomepageFavoriteCatalogsEn,
  et: getHomepageFavoriteCatalogsEt,
} as const;

export const getHomepageFavoriteCatalogs = cache(async (locale: Locale) => {
  return homepageFavoriteCatalogsByLocale[locale]();
});

export async function getMotorcycleCatalog(
  locale: Locale = "en",
): Promise<CatalogProduct[]> {
  try {
    const { nodes, nodesById } = await fetchAllCatalogNodes(
      { category: "motorcycles" },
      locale,
    );
    const showroomMetaSourcesByProductId =
      await buildCatalogShowroomMetaSourcesMap(nodes, locale);

    return nodes.map((node) =>
      mapCatalogCard(node, locale, nodesById, showroomMetaSourcesByProductId),
    );
  } catch (error) {
    console.error("[motorcycles] GraphQL catalog fetch failed:", error);
    throw error;
  }
}

export async function getEquipmentCatalog(
  locale: Locale = "en",
): Promise<CatalogProduct[]> {
  try {
    const { nodes, nodesById } = await fetchAllCatalogNodes(
      {
        categoryNotIn: ["motorcycles", "tools-maintenance"],
      },
      locale,
    );

    return mapEquipmentCatalogNodes(nodes, locale, nodesById);
  } catch (error) {
    console.error("[equipment] GraphQL catalog fetch failed:", error);
    throw error;
  }
}

export async function getEquipmentCatalogForRoute(
  route: CategoryRoute,
  locale: Locale = "en",
): Promise<CatalogProduct[]> {
  try {
    const where = resolveEquipmentCatalogWhere(route);
    const { nodes, nodesById } = await fetchAllCatalogNodes(where, locale);
    return mapCatalogNodesForRoute(nodes, route, locale, nodesById);
  } catch (error) {
    console.error("[equipment] GraphQL catalog fetch failed:", error);
    throw error;
  }
}

export async function getToolsCatalog(
  locale: Locale = "en",
): Promise<CatalogProduct[]> {
  try {
    const { nodes, nodesById } = await fetchAllCatalogNodes(
      {
        category: TOOLS_WC_SLUG,
      },
      locale,
    );

    return mapToolsCatalogNodes(nodes, locale, nodesById);
  } catch (error) {
    console.error("[tools] GraphQL catalog fetch failed:", error);
    throw error;
  }
}

export async function getCatalogProductsBySlugs(
  slugs: readonly string[],
  locale: Locale = "en",
): Promise<CatalogProduct[]> {
  const products = await Promise.all(
    slugs.map((slug) => getProductBySlug(slug, locale)),
  );
  return products.filter((product): product is CatalogProduct => product !== undefined);
}

export async function getSimilarProducts(
  product: CatalogProduct,
  limit = RELATED_PRODUCTS_LIMIT,
  locale: Locale = "en",
): Promise<CatalogProduct[]> {
  try {
    const catalog =
      product.type === "motorcycle"
        ? await getMotorcycleCatalog(locale)
        : await getEquipmentCatalog(locale);

    return pickSimilarProducts(product, catalog, limit);
  } catch (error) {
    console.error("[similar-products] GraphQL catalog fetch failed:", error);
    return [];
  }
}
