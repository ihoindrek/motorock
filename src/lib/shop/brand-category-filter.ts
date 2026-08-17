import type { Dictionary } from "@/i18n/dictionaries/en";
import { resolveProductCategoryLabel } from "@/lib/seo/product-seo-copy";
import type { CatalogProduct, ProductCategory } from "@/types/catalog-product";

const BRAND_FILTER_CATEGORY_ORDER: readonly ProductCategory[] = [
  "jackets",
  "vests",
  "pants",
  "hoodies",
  "t-shirts",
  "gloves",
  "footwear",
  "base-layers",
  "helmets",
  "goggles",
  "headwear",
  "bags",
  "belts",
  "jewelry",
  "scarves",
  "socks",
  "safety",
  "accessories",
  "other",
];

const HIDDEN_BRAND_FILTER_CATEGORIES = new Set<ProductCategory>([
  "motorcycles",
  "tools",
  "helmet-accessories",
]);

export type ProductCategoryFilterOption = {
  id: ProductCategory;
  label: string;
};

export function resolveAvailableProductCategories(
  products: readonly CatalogProduct[],
  dict: Dictionary,
): ProductCategoryFilterOption[] {
  const counts = new Map<ProductCategory, number>();

  for (const product of products) {
    if (HIDDEN_BRAND_FILTER_CATEGORIES.has(product.category)) {
      continue;
    }

    counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  }

  return BRAND_FILTER_CATEGORY_ORDER.filter((category) => counts.has(category))
    .map((category) => ({
      id: category,
      label: resolveProductCategoryLabel(category, dict) ?? category,
    }))
    .filter((option) => option.label.length > 0);
}

export function shouldShowBrandProductCategoryFilter(
  routeBrand: string | undefined,
  options: readonly ProductCategoryFilterOption[],
) {
  return Boolean(routeBrand) && options.length > 1;
}

export function matchProductCategoriesFromParam(
  param: string,
  options: readonly ProductCategoryFilterOption[],
) {
  const wanted = new Set(
    param
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );

  return options
    .filter((option) => wanted.has(option.id))
    .map((option) => option.id);
}
