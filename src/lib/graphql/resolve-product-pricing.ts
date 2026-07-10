import type { Locale } from "@/i18n/config";
import type {
  GraphQLProduct,
  GraphQLProductCard,
  GraphQLProductVariation,
  GraphQLVariableProduct,
} from "@/lib/graphql/types";
import {
  findTranslationDatabaseId,
  getGraphqlLanguageCode,
} from "@/lib/graphql/wpml";

/** WooCommerce prices are canonical in the default catalog language (EN). */
const PRICING_LOCALE: Locale = "en";

type PricedNode = {
  price?: string | null;
  regularPrice?: string | null;
};

function variationAttributeKey(variation: GraphQLProductVariation) {
  return (variation.attributes?.nodes ?? [])
    .map((attribute) => `${attribute.name}:${attribute.value}`)
    .sort()
    .join("|");
}

export function mergeGraphqlProductPricing(
  localized: GraphQLProduct,
  pricingSource: GraphQLProduct,
): GraphQLProduct {
  if (localized.databaseId === pricingSource.databaseId) {
    return localized;
  }

  if (localized.__typename !== pricingSource.__typename) {
    return localized;
  }

  const merged: GraphQLProduct = {
    ...localized,
    price: pricingSource.price ?? localized.price,
    regularPrice: pricingSource.regularPrice ?? localized.regularPrice,
  };

  if (
    localized.__typename !== "VariableProduct" ||
    pricingSource.__typename !== "VariableProduct"
  ) {
    return merged;
  }

  const pricingByKey = new Map(
    (pricingSource.variations?.nodes ?? []).map((variation) => [
      variationAttributeKey(variation),
      variation,
    ]),
  );

  const variableProduct = merged as GraphQLVariableProduct;

  return {
    ...variableProduct,
    variations: {
      nodes: (localized.variations?.nodes ?? []).map((variation) => {
        const pricing = pricingByKey.get(variationAttributeKey(variation));

        if (!pricing) {
          return variation;
        }

        return {
          ...variation,
          price: pricing.price ?? variation.price,
          regularPrice: pricing.regularPrice ?? variation.regularPrice,
        };
      }),
    },
  };
}

export function mergeCardPricingFields<
  T extends GraphQLProductCard & PricedNode,
>(localized: T, pricingSource: T): T {
  if (localized.databaseId === pricingSource.databaseId) {
    return localized;
  }

  return {
    ...localized,
    price: pricingSource.price ?? localized.price,
    regularPrice: pricingSource.regularPrice ?? localized.regularPrice,
  };
}

export function resolveCatalogPricingNode<T extends GraphQLProductCard>(
  node: T,
  nodesById: Map<number, GraphQLProductCard>,
): T {
  if (getGraphqlLanguageCode(node) === PRICING_LOCALE) {
    return node;
  }

  const pricingId = findTranslationDatabaseId(node, PRICING_LOCALE);
  if (pricingId) {
    const pricingNode = nodesById.get(pricingId);
    if (pricingNode) {
      return mergeCardPricingFields(node, pricingNode as T);
    }
  }

  for (const candidate of nodesById.values()) {
    if (getGraphqlLanguageCode(candidate) !== PRICING_LOCALE) {
      continue;
    }

    if (findTranslationDatabaseId(candidate, "et") === node.databaseId) {
      return mergeCardPricingFields(node, candidate as T);
    }
  }

  return node;
}
