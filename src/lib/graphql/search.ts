import type { Locale } from "@/i18n/config";
import type { CatalogProduct, ProductType } from "@/types/catalog-product";
import { graphqlRequest } from "@/lib/graphql/client";
import { mapGraphqlCardToCatalogProduct } from "@/lib/graphql/map-graphql-product";
import { buildCatalogShowroomMetaSourcesMap } from "@/lib/graphql/products";
import { PRODUCT_SEARCH } from "@/lib/graphql/queries";
import type { GraphQLProductCard } from "@/lib/graphql/types";
import { collectShowroomMetaSourcesFromSiblingProducts } from "@/lib/shop/resolve-showroom-available";
import { selectCatalogNodesForLocale } from "@/lib/graphql/wpml";

export const HEADER_SEARCH_LIMIT = 5;

export type ProductSearchResult = {
  slug: string;
  name: string;
  brand: string;
  price: number;
  regularPrice?: number;
  image: string;
  type: ProductType;
  categoryLabel: string;
  inStock: boolean;
};

type ProductSearchResponse = {
  products: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    nodes: GraphQLProductCard[];
  };
};

type ProductSearchVariables = {
  search: string;
  first: number;
  after: string | null;
};

function isToolsProduct(node: GraphQLProductCard) {
  return (node.productCategories?.nodes ?? []).some(
    (category) => category.slug === "tools-maintenance",
  );
}

function visibleSearchNodes(nodes: readonly GraphQLProductCard[], locale: Locale) {
  const localized = selectCatalogNodesForLocale(nodes, locale);

  if (locale === "et") {
    return localized;
  }

  return localized.filter((node) => !isToolsProduct(node));
}

function indexSearchNodesById(nodes: readonly GraphQLProductCard[]) {
  const nodesById = new Map<number, GraphQLProductCard>();

  for (const node of nodes) {
    if (node.databaseId) {
      nodesById.set(node.databaseId, node);
    }
  }

  return nodesById;
}

function mapSearchNode(
  node: GraphQLProductCard,
  locale: Locale,
  nodesById: Map<number, GraphQLProductCard>,
): ProductSearchResult {
  const product = mapGraphqlCardToCatalogProduct(node, locale, {
    showroomMetaSources: collectShowroomMetaSourcesFromSiblingProducts(
      node,
      nodesById,
    ),
  });

  return {
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    regularPrice: product.regularPrice,
    image: product.image,
    type: product.type,
    categoryLabel: product.backLabel,
    inStock: product.inStock,
  };
}

export async function searchProductsPage(
  query: string,
  limit: number,
  locale: Locale = "en",
  after: string | null = null,
): Promise<{
  results: ProductSearchResult[];
  hasMore: boolean;
  endCursor: string | null;
}> {
  const search = query.trim();

  if (search.length < 2) {
    return { results: [], hasMore: false, endCursor: null };
  }

  const data = await graphqlRequest<
    ProductSearchResponse,
    ProductSearchVariables
  >(
    PRODUCT_SEARCH,
    { search, first: limit, after },
    { cache: "no-store" },
  );

  const nodesById = indexSearchNodesById(data.products.nodes);
  const nodes = visibleSearchNodes(data.products.nodes, locale);

  return {
    results: nodes.map((node) => mapSearchNode(node, locale, nodesById)),
    hasMore: data.products.pageInfo.hasNextPage,
    endCursor: data.products.pageInfo.endCursor,
  };
}

export async function searchProducts(
  query: string,
  limit = HEADER_SEARCH_LIMIT,
  locale: Locale = "en",
): Promise<ProductSearchResult[]> {
  const page = await searchProductsPage(query, limit, locale);
  return page.results;
}

export async function searchProductsWithMeta(
  query: string,
  limit = HEADER_SEARCH_LIMIT,
  locale: Locale = "en",
): Promise<{
  results: ProductSearchResult[];
  hasMore: boolean;
}> {
  const page = await searchProductsPage(query, limit, locale);
  return {
    results: page.results,
    hasMore: page.hasMore,
  };
}

export async function getSearchCatalog(
  query: string,
  locale: Locale = "en",
  max = 100,
): Promise<CatalogProduct[]> {
  const search = query.trim();

  if (search.length < 2) {
    return [];
  }

  const products: CatalogProduct[] = [];
  let after: string | null = null;

  while (products.length < max) {
    const data: ProductSearchResponse = await graphqlRequest<
      ProductSearchResponse,
      ProductSearchVariables
    >(
      PRODUCT_SEARCH,
      {
        search,
        first: Math.min(50, max - products.length),
        after,
      },
      { cache: "no-store" },
    );

    const nodesById = indexSearchNodesById(data.products.nodes);
    const nodes = visibleSearchNodes(data.products.nodes, locale);
    const showroomMetaSourcesByProductId =
      await buildCatalogShowroomMetaSourcesMap(nodes, locale);

    products.push(
      ...nodes.map((node) =>
        mapGraphqlCardToCatalogProduct(node, locale, {
          showroomMetaSources:
            (node.databaseId
              ? showroomMetaSourcesByProductId.get(node.databaseId)
              : undefined) ??
            collectShowroomMetaSourcesFromSiblingProducts(node, nodesById),
        }),
      ),
    );

    if (!data.products.pageInfo.hasNextPage) {
      break;
    }

    after = data.products.pageInfo.endCursor;
  }

  return products;
}
