import { resolveLineVariationId } from "@/lib/shop/resolve-cart-variation";
import type { CatalogProduct } from "@/types/catalog-product";

export type MetaCatalogIds = {
  productId: number;
  variationIds: Readonly<Record<string, number>>;
};

type MetaCatalogSource = Pick<
  CatalogProduct,
  | "databaseId"
  | "metaCatalogProductId"
  | "metaCatalogVariationIds"
  | "variationIds"
  | "sizes"
>;

export function usesLocalizedWooCatalogIds(product: MetaCatalogSource) {
  return (
    product.metaCatalogProductId != null &&
    product.databaseId != null &&
    product.metaCatalogProductId !== product.databaseId
  );
}

/** Meta / GA4 must never use WPML-local variation ids when EN catalog ids exist. */
export function resolveMetaCatalogVariationId(
  product: MetaCatalogSource,
  options?: {
    variationId?: number;
    size?: string;
    color?: string;
  },
): number | undefined {
  const metaVariationIds = product.metaCatalogVariationIds;
  if (metaVariationIds) {
    const fromMetaMap = resolveLineVariationId(
      {
        variationIds: metaVariationIds,
        sizes: product.sizes ?? [],
      },
      options?.size,
      options?.color,
    );
    if (fromMetaMap) {
      return fromMetaMap;
    }
  }

  const candidate = options?.variationId;
  if (candidate == null) {
    return undefined;
  }

  const localizedIds = product.variationIds
    ? new Set(Object.values(product.variationIds))
    : null;
  const metaIds = metaVariationIds
    ? new Set(Object.values(metaVariationIds))
    : null;

  if (metaIds?.has(candidate)) {
    return candidate;
  }

  if (usesLocalizedWooCatalogIds(product) && localizedIds?.has(candidate)) {
    return undefined;
  }

  return candidate;
}

export function attachMetaCatalogFields<
  T extends MetaCatalogSource,
>(product: T, metaCatalog?: MetaCatalogIds): T {
  if (!metaCatalog) {
    return product;
  }

  return {
    ...product,
    metaCatalogProductId: metaCatalog.productId,
    metaCatalogVariationIds: metaCatalog.variationIds,
  };
}
