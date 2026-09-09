import { resolveMetaCatalogVariationId } from "@/lib/analytics/meta-catalog-id";
import {
  getSelectableColors,
  hasMultipleColorChoices,
} from "@/lib/shop/product-color-swatches";
import { resolveLineVariationId } from "@/lib/shop/resolve-cart-variation";
import {
  resolveActiveProductInStock,
  resolveActiveProductPrice,
} from "@/lib/shop/resolve-product-variation";
import { formatSizeLabel, isOneSizeLabel } from "@/lib/shop/size-label";
import { sortProductSizes } from "@/lib/shop/sort-sizes";
import type { CartLine } from "@/context/cart-context";
import type { CatalogProduct } from "@/types/catalog-product";

export type ProductQuickAddMode = "none" | "sizes" | "single" | "view";

export function getProductQuickAddMode(
  product: CatalogProduct,
): ProductQuickAddMode {
  if (product.type === "motorcycle" || !product.inStock) {
    return "none";
  }

  if (hasMultipleColorChoices(product.colors)) {
    return "view";
  }

  if ((product.legLengths?.length ?? 0) > 1) {
    return "view";
  }

  const sizes = getQuickAddSizes(product);
  if (sizes.length > 1) {
    return "sizes";
  }

  return "single";
}

export function getQuickAddSizes(product: CatalogProduct): string[] {
  return sortProductSizes(product.sizes).filter((size) => !isOneSizeLabel(size));
}

export function buildQuickAddCartLine(
  product: CatalogProduct,
  size?: string,
): Omit<CartLine, "quantity"> {
  const defaultColor = getSelectableColors(product.colors)[0];
  const color = defaultColor || undefined;
  const legLength =
    product.legLengths?.length === 1 ? product.legLengths[0] : undefined;
  const resolvedSize = size
    ? formatSizeLabel(size)
    : formatSizeLabel(sortProductSizes(product.sizes)[0] ?? "One size");
  const variationId = resolveLineVariationId(
    product,
    resolvedSize,
    color,
    legLength,
  );
  const price = resolveActiveProductPrice(
    product,
    resolvedSize,
    color,
    legLength,
  );
  const variationImage = product.variations?.find(
    (variation) => variation.databaseId === variationId,
  )?.image;

  return {
    slug: product.slug,
    name: product.name,
    price,
    image: variationImage ?? product.image,
    brand: product.brand,
    type: product.type,
    size: isOneSizeLabel(resolvedSize) ? undefined : resolvedSize,
    color,
    legLength,
    productId: product.databaseId,
    variationId,
    metaCatalogProductId: product.metaCatalogProductId,
    metaCatalogVariationId: resolveMetaCatalogVariationId(product, {
      variationId,
      size: resolvedSize,
      color,
    }),
  };
}

export function isQuickAddSizeAvailable(
  product: CatalogProduct,
  size: string,
): boolean {
  const defaultColor = getSelectableColors(product.colors)[0];
  const color = defaultColor || undefined;
  const legLength =
    product.legLengths?.length === 1 ? product.legLengths[0] : undefined;

  return resolveActiveProductInStock(
    product,
    formatSizeLabel(size),
    color,
    legLength,
  );
}
