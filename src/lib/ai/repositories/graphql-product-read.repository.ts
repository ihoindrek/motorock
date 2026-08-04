import type { Locale } from "@/i18n/config";
import { graphqlRequest } from "@/lib/graphql/client";
import { PRODUCT_BY_DATABASE_ID } from "@/lib/graphql/queries";
import type { GraphQLProduct } from "@/lib/graphql/types";
import {
  findTranslationDatabaseId,
  getGraphqlLanguageCode,
} from "@/lib/graphql/wpml";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";
import { toNormalizedProduct } from "@/lib/ai/repositories/normalize-product";

type ProductByDatabaseIdResponse = {
  product: GraphQLProduct | null;
};

export interface ProductReadRepository {
  getById(productId: number, locale: Locale): Promise<NormalizedProduct | null>;
}

async function fetchProductUncached(databaseId: number) {
  const data = await graphqlRequest<
    ProductByDatabaseIdResponse,
    { id: number }
  >(PRODUCT_BY_DATABASE_ID, { id: databaseId }, { next: { revalidate: 0 } });

  return data.product;
}

export class GraphqlProductReadRepository implements ProductReadRepository {
  async getById(productId: number, locale: Locale): Promise<NormalizedProduct | null> {
    let product = await fetchProductUncached(productId);
    if (!product) {
      return null;
    }

    if (getGraphqlLanguageCode(product) !== locale) {
      const translationId = findTranslationDatabaseId(product, locale);
      if (translationId && translationId !== product.databaseId) {
        product = (await fetchProductUncached(translationId)) ?? product;
      }
    }

    return toNormalizedProduct(product, locale);
  }
}
