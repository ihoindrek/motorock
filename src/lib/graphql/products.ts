import type { Locale } from "@/i18n/config";
import type { CatalogProduct } from "@/types/catalog-product";
import type { MotorcycleProduct } from "@/types/motorcycle-product";
import { pickSimilarProducts } from "@/lib/shop/similar-products";
import {
  type CategoryRoute,
  resolveEquipmentCatalogWhere,
} from "@/lib/shop/category";
import { graphqlRequest } from "@/lib/graphql/client";
import {
  isGraphqlMotorcycle,
  mapGraphqlCardToCatalogProduct,
  mapGraphqlToCatalogProduct,
  mapGraphqlToMotorcycleProduct,
} from "@/lib/graphql/map-graphql-product";
import { PRODUCT_BY_SLUG, PRODUCT_CATALOG_PAGE } from "@/lib/graphql/queries";
import type { GraphQLProduct, GraphQLProductCard } from "@/lib/graphql/types";
import {
  getGraphqlLanguageCode,
  resolveProductSlugForLocale,
  buildProductSlugAlternates,
  selectCatalogNodesForLocale,
} from "@/lib/graphql/wpml";

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

async function fetchAllCatalogNodes(
  where: CatalogWhere,
  locale: Locale,
): Promise<GraphQLProductCard[]> {
  const nodes: GraphQLProductCard[] = [];
  let after: string | null = null;

  for (;;) {
    const variables: CatalogPageVariables = {
      first: CATALOG_PAGE_SIZE,
      after,
      category: where.category ?? null,
      categoryNotIn: where.categoryNotIn ?? null,
    };

    const data = await graphqlRequest<CatalogPageResponse, CatalogPageVariables>(
      PRODUCT_CATALOG_PAGE,
      variables,
    );

    nodes.push(...selectCatalogNodesForLocale(data.products.nodes, locale));

    if (!data.products.pageInfo.hasNextPage) {
      break;
    }

    after = data.products.pageInfo.endCursor;
  }

  return nodes;
}

function mapEquipmentCatalogNodes(
  nodes: GraphQLProductCard[],
  locale: Locale,
): CatalogProduct[] {
  return nodes
    .map((node) => mapGraphqlCardToCatalogProduct(node, locale))
    .filter(
      (product) =>
        product.type === "equipment" && product.category !== "tools",
    );
}

export async function fetchGraphqlProductBySlug(slug: string) {
  try {
    const data = await graphqlRequest<ProductBySlugResponse>(PRODUCT_BY_SLUG, {
      slug,
    });
    return data.product;
  } catch {
    return null;
  }
}

export async function getProductBySlugForLocale(
  slug: string,
  locale: Locale,
): Promise<CatalogProduct | undefined> {
  const remote = await fetchGraphqlProductBySlug(slug);

  if (!remote) {
    return undefined;
  }

  if (getGraphqlLanguageCode(remote) === locale) {
    return mapGraphqlToCatalogProduct(remote);
  }

  const translatedSlug = resolveProductSlugForLocale(remote, locale);
  if (translatedSlug && translatedSlug !== slug) {
    const translated = await fetchGraphqlProductBySlug(translatedSlug);
    if (translated && getGraphqlLanguageCode(translated) === locale) {
      return mapGraphqlToCatalogProduct(translated);
    }
  }

  if (locale === "et" && getGraphqlLanguageCode(remote) === "en") {
    return mapGraphqlToCatalogProduct(remote);
  }

  return undefined;
}

export async function getMotorcycleProductBySlug(
  slug: string,
  locale: Locale = "en",
): Promise<MotorcycleProduct | null> {
  const remote = await fetchGraphqlProductBySlug(slug);

  if (remote && isGraphqlMotorcycle(remote)) {
    if (getGraphqlLanguageCode(remote) === locale) {
      return mapGraphqlToMotorcycleProduct(remote);
    }

    const translatedSlug = resolveProductSlugForLocale(remote, locale);
    if (translatedSlug) {
      const translated = await fetchGraphqlProductBySlug(translatedSlug);
      if (translated && isGraphqlMotorcycle(translated)) {
        return mapGraphqlToMotorcycleProduct(translated);
      }
    }

    if (locale === "et" && getGraphqlLanguageCode(remote) === "en") {
      return mapGraphqlToMotorcycleProduct(remote);
    }
  }

  return null;
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

  return buildProductSlugAlternates(remote);
}

export async function getMotorcycleCatalog(
  locale: Locale = "en",
): Promise<CatalogProduct[]> {
  try {
    const nodes = await fetchAllCatalogNodes({ category: "motorcycles" }, locale);
    return nodes.map((node) => mapGraphqlCardToCatalogProduct(node, locale));
  } catch (error) {
    console.error("[motorcycles] GraphQL catalog fetch failed:", error);
    return [];
  }
}

export async function getEquipmentCatalog(
  locale: Locale = "en",
): Promise<CatalogProduct[]> {
  try {
    const nodes = await fetchAllCatalogNodes(
      {
        categoryNotIn: ["motorcycles", "tools-maintenance"],
      },
      locale,
    );

    return mapEquipmentCatalogNodes(nodes, locale);
  } catch (error) {
    console.error("[equipment] GraphQL catalog fetch failed:", error);
    return [];
  }
}

export async function getEquipmentCatalogForRoute(
  route: CategoryRoute,
  locale: Locale = "en",
): Promise<CatalogProduct[]> {
  try {
    const where = resolveEquipmentCatalogWhere(route);
    const nodes = await fetchAllCatalogNodes(where, locale);
    return mapEquipmentCatalogNodes(nodes, locale);
  } catch (error) {
    console.error("[equipment] GraphQL catalog fetch failed:", error);
    return [];
  }
}

export async function getToolsCatalog(
  locale: Locale = "en",
): Promise<CatalogProduct[]> {
  if (locale !== "et") {
    return [];
  }

  try {
    const nodes = await fetchAllCatalogNodes(
      {
        category: "tools-maintenance",
      },
      locale,
    );

    return nodes
      .map((node) => mapGraphqlCardToCatalogProduct(node, locale))
      .filter((product) => product.category === "tools");
  } catch (error) {
    console.error("[tools] GraphQL catalog fetch failed:", error);
    return [];
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
  limit = 4,
  locale: Locale = "en",
): Promise<CatalogProduct[]> {
  const catalog =
    product.type === "motorcycle"
      ? await getMotorcycleCatalog(locale)
      : await getEquipmentCatalog(locale);

  return pickSimilarProducts(product, catalog, limit);
}
