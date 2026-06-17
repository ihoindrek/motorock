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

    nodes.push(...data.products.nodes);

    if (!data.products.pageInfo.hasNextPage) {
      break;
    }

    after = data.products.pageInfo.endCursor;
  }

  return nodes;
}

function mapEquipmentCatalogNodes(
  nodes: GraphQLProductCard[],
): CatalogProduct[] {
  return nodes
    .map(mapGraphqlCardToCatalogProduct)
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

export async function getMotorcycleProductBySlug(
  slug: string,
): Promise<MotorcycleProduct | null> {
  const remote = await fetchGraphqlProductBySlug(slug);

  if (remote && isGraphqlMotorcycle(remote)) {
    return mapGraphqlToMotorcycleProduct(remote);
  }

  return null;
}

export async function getProductBySlug(
  slug: string,
): Promise<CatalogProduct | undefined> {
  const remote = await fetchGraphqlProductBySlug(slug);

  if (remote) {
    return mapGraphqlToCatalogProduct(remote);
  }

  return undefined;
}

export async function getMotorcycleCatalog(): Promise<CatalogProduct[]> {
  try {
    const nodes = await fetchAllCatalogNodes({ category: "motorcycles" });
    return nodes.map(mapGraphqlCardToCatalogProduct);
  } catch (error) {
    console.error("[motorcycles] GraphQL catalog fetch failed:", error);
    return [];
  }
}

export async function getEquipmentCatalog(): Promise<CatalogProduct[]> {
  try {
    const nodes = await fetchAllCatalogNodes({
      categoryNotIn: ["motorcycles", "tools-maintenance"],
    });

    return mapEquipmentCatalogNodes(nodes);
  } catch (error) {
    console.error("[equipment] GraphQL catalog fetch failed:", error);
    return [];
  }
}

export async function getEquipmentCatalogForRoute(
  route: CategoryRoute,
): Promise<CatalogProduct[]> {
  try {
    const where = resolveEquipmentCatalogWhere(route);
    const nodes = await fetchAllCatalogNodes(where);
    return mapEquipmentCatalogNodes(nodes);
  } catch (error) {
    console.error("[equipment] GraphQL catalog fetch failed:", error);
    return [];
  }
}

export async function getToolsCatalog(): Promise<CatalogProduct[]> {
  try {
    const nodes = await fetchAllCatalogNodes({
      category: "tools-maintenance",
    });

    return nodes
      .map(mapGraphqlCardToCatalogProduct)
      .filter((product) => product.category === "tools");
  } catch (error) {
    console.error("[tools] GraphQL catalog fetch failed:", error);
    return [];
  }
}

export async function getCatalogProductsBySlugs(
  slugs: readonly string[],
): Promise<CatalogProduct[]> {
  const products = await Promise.all(slugs.map((slug) => getProductBySlug(slug)));
  return products.filter((product): product is CatalogProduct => product !== undefined);
}

export async function getSimilarProducts(
  product: CatalogProduct,
  limit = 4,
): Promise<CatalogProduct[]> {
  const catalog =
    product.type === "motorcycle"
      ? await getMotorcycleCatalog()
      : await getEquipmentCatalog();

  return pickSimilarProducts(product, catalog, limit);
}
