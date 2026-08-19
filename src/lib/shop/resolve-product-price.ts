import { parseGraphqlPrice } from "@/lib/shop/parse-graphql-price";

export type ResolvedProductPrice = {
  /** Current customer price (sale price when on sale). */
  price: number;
  /** Original price before discount — only set when on sale. */
  regularPrice?: number;
};

type GraphqlPriceNode = {
  price?: string | null;
  regularPrice?: string | null;
};

export function resolveGraphqlProductPrice(
  node: GraphqlPriceNode,
): ResolvedProductPrice {
  const regular = parseGraphqlPrice(node.regularPrice);
  const current = parseGraphqlPrice(node.price);

  if (regular > 0 && current > 0 && current < regular) {
    return { price: current, regularPrice: regular };
  }

  const price = regular > 0 ? regular : current;
  return { price };
}

export function isProductOnSale(price: ResolvedProductPrice) {
  return (
    typeof price.regularPrice === "number" && price.regularPrice > price.price
  );
}

export function resolveProductDiscountPercent(
  price: number,
  regularPrice?: number,
) {
  if (
    typeof regularPrice !== "number" ||
    regularPrice <= 0 ||
    price <= 0 ||
    price >= regularPrice
  ) {
    return null;
  }

  return Math.round((1 - price / regularPrice) * 100);
}
