import type { CatalogProduct } from "@/types/catalog-product";
import { formatSizeLabel } from "@/lib/shop/size-label";

export function resolveLineVariationId(
  product: Pick<CatalogProduct, "variationIds" | "sizes">,
  size?: string,
  color?: string,
): number | undefined {
  const variationIds = product.variationIds;
  if (!variationIds) {
    return undefined;
  }

  if (size && size !== "One size") {
    const normalizedSize = formatSizeLabel(size);
    const bySize =
      variationIds[normalizedSize] ??
      variationIds[size] ??
      Object.entries(variationIds).find(([key]) =>
        formatSizeLabel(key).toLowerCase() === normalizedSize.toLowerCase(),
      )?.[1];

    if (bySize) {
      return bySize;
    }
  }

  if (color) {
    const byColor =
      variationIds[color] ??
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

  const sizeCount = product.sizes.filter((option) => option !== "One size").length;
  if (sizeCount <= 1 && values.length > 0) {
    return values[0];
  }

  return undefined;
}
