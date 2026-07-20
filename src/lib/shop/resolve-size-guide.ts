import {
  sizeGuidesByBrandCategory,
} from "@/data/size-guides/demo";
import type { CatalogProduct } from "@/types/catalog-product";
import type { SizeGuide } from "@/types/size-guide";

function brandSlug(brand: string) {
  return brand
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function filterRowsForProduct(
  guide: SizeGuide,
  productSizes: readonly string[],
): SizeGuide {
  if (productSizes.length === 0) {
    return guide;
  }

  const normalizedSizes = new Set(
    productSizes.map((size) => size.trim().toUpperCase()),
  );

  const rows = guide.rows.filter((row) =>
    normalizedSizes.has(row.size.trim().toUpperCase()),
  );

  if (rows.length === 0) {
    return guide;
  }

  return { ...guide, rows };
}

/**
 * Brand-specific charts only. Category demo fallbacks are disabled until
 * real manufacturer size tables are loaded into `sizeGuidesByBrandCategory`.
 */
export function resolveSizeGuide(product: CatalogProduct): SizeGuide | null {
  if (product.type !== "equipment") {
    return null;
  }

  if (product.sizes.length <= 1 && product.sizes[0] === "One size") {
    return null;
  }

  const slug = brandSlug(product.brand);
  const brandGuide = sizeGuidesByBrandCategory[slug]?.[product.category];

  if (!brandGuide) {
    return null;
  }

  return filterRowsForProduct(brandGuide, product.sizes);
}
