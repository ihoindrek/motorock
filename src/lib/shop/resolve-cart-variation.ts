import type { CatalogProduct } from "@/types/catalog-product";
import { formatSizeLabel, isOneSizeLabel, sizesMatch } from "@/lib/shop/size-label";
import { buildVariationLookupKey } from "@/lib/shop/product-variation-dimensions";
import { euUkSizesMatch } from "@/lib/shop/eu-uk-size";

function lookupCompositeVariationId(
  variationIds: Readonly<Record<string, number>>,
  input: { size?: string; color?: string; legLength?: string },
) {
  const candidates = [
    buildVariationLookupKey(input),
    buildVariationLookupKey({ ...input, color: undefined }),
  ];

  if (input.color?.trim()) {
    candidates.push(
      buildVariationLookupKey({
        ...input,
        color: input.color.trim().toLowerCase(),
      }),
    );
  }

  for (const key of candidates) {
    const match = variationIds[key];
    if (match) {
      return match;
    }
  }

  return undefined;
}

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

  const compositeMatch = lookupCompositeVariationId(variationIds, {
    size,
    color,
    legLength,
  });
  if (compositeMatch) {
    return compositeMatch;
  }

  const hasMultipleLegLengths = (product.legLengths?.length ?? 0) > 1;
  if (legLength?.trim() || hasMultipleLegLengths) {
    return undefined;
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
