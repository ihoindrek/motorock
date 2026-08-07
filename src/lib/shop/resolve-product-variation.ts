import type { CatalogProduct, ProductVariation } from "@/types/catalog-product";
import { resolveLineVariationId } from "@/lib/shop/resolve-cart-variation";

export function resolveActiveProductVariation(
  product: Pick<CatalogProduct, "variations" | "variationIds" | "sizes">,
  size?: string,
  color?: string,
): ProductVariation | undefined {
  const variationId = resolveLineVariationId(product, size, color);

  if (!variationId || !product.variations?.length) {
    return undefined;
  }

  return product.variations.find(
    (variation) => variation.databaseId === variationId,
  );
}

export function resolveActiveProductPrice(
  product: Pick<CatalogProduct, "price" | "variations" | "variationIds" | "sizes">,
  size?: string,
  color?: string,
): number {
  const variation = resolveActiveProductVariation(product, size, color);

  if (typeof variation?.price === "number" && variation.price > 0) {
    return variation.price;
  }

  return product.price;
}
