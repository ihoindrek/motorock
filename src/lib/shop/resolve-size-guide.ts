import type { CatalogProduct, ProductGender } from "@/types/catalog-product";
import type { SizeGuide } from "@/types/size-guide";
import {
  sizeGuideLookupKey,
  type SizeGuideRegistry,
} from "@/lib/shop/size-guide-registry";

function brandSlug(brand: string) {
  return brand
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function findGuideByBrandCategoryGender(
  registry: SizeGuideRegistry,
  brand: string,
  category: CatalogProduct["category"],
  genders: readonly ProductGender[],
): SizeGuide | undefined {
  for (const gender of genders) {
    const guide =
      registry.byBrandCategoryGender[
        sizeGuideLookupKey(brand, category, gender)
      ];

    if (guide) {
      return guide;
    }
  }

  return undefined;
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

function gendersToTry(gender: ProductGender): readonly ProductGender[] {
  if (gender === "unisex") {
    return ["unisex"];
  }

  return [gender, "unisex"];
}

export function resolveSizeGuide(
  product: CatalogProduct,
  registry: SizeGuideRegistry,
): SizeGuide | null {
  if (product.type !== "equipment") {
    return null;
  }

  if (product.sizes.length <= 1 && product.sizes[0] === "One size") {
    return null;
  }

  if (product.sizeGuideSlug) {
    const override = registry.bySlug[product.sizeGuideSlug.trim()];
    if (override) {
      return filterRowsForProduct(override, product.sizes);
    }
  }

  const slug = brandSlug(product.brand);
  const genders = gendersToTry(product.gender);
  const autoMatch =
    findGuideByBrandCategoryGender(registry, slug, product.category, genders) ??
    findGuideByBrandCategoryGender(
      registry,
      slug,
      product.category,
      gendersToTry("unisex"),
    );

  if (autoMatch) {
    return filterRowsForProduct(autoMatch, product.sizes);
  }

  return null;
}
