import type { CatalogProduct } from "@/types/catalog-product";
import { formatSizeLabel, isOneSizeLabel, sizesMatch } from "@/lib/shop/size-label";
import { buildVariationLookupKey } from "@/lib/shop/product-variation-dimensions";
import { euUkSizesMatch } from "@/lib/shop/eu-uk-size";

export function resolveLineVariationId(
  product: Pick<CatalogProduct, "variationIds" | "sizes" | "legLengths">,
  size?: string,
  color?: string,
  legLength?: string,
): number | undefined {
  const variationIds = product.variationIds;
  if (!variationIds) {
    return undefined;
  }

  const compositeKey = buildVariationLookupKey({ size, color, legLength });
  if (variationIds[compositeKey]) {
    return variationIds[compositeKey];
  }

  if (size && !isOneSizeLabel(size)) {
    const normalizedSize = formatSizeLabel(size);
    const bySize =
      variationIds[normalizedSize] ??
      variationIds[size] ??
      Object.entries(variationIds).find(
        ([key]) => sizesMatch(key, size) || euUkSizesMatch(key, size),
      )?.[1];

    if (bySize) {
      return bySize;
    }
  }

  if (color) {
    const byColor =
      variationIds[color] ??
      variationIds[color.toLowerCase()] ??
      Object.entries(variationIds).find(
        ([key]) => key.toLowerCase() === color.toLowerCase(),
      )?.[1];

    if (byColor) {
      return byColor;
    }
  }

  const values = Object.values(variationIds);
  if (values.length === 1) {
    return values[0];
  }

  const sizeCount = product.sizes.filter((option) => !isOneSizeLabel(option)).length;
  const legLengthCount = product.legLengths?.length ?? 0;
  if (sizeCount <= 1 && legLengthCount <= 1 && values.length > 0) {
    return values[0];
  }

  return undefined;
}
