import type { ProductCategory } from "@/types/catalog-product";

/** WooCommerce `productCategories` slug → storefront category */
export const WC_SLUG_TO_CATEGORY: Record<string, ProductCategory> = {
  "jackets-and-tags": "jackets",
  "jackets-and-tags-2": "jackets",
  "vests-2": "vests",
  "vests-3": "vests",
  "mens-pants": "pants",
  "pants-jeans": "pants",
  gloves: "gloves",
  "gloves-2": "gloves",
  footwear: "footwear",
  "footwear-2": "footwear",
  sweaters: "hoodies",
  "hoodies-sweatshirts": "hoodies",
  "t-shirts": "t-shirts",
  "t-shirts-jerseys": "t-shirts",
  "base-layer-warm-underwear": "base-layers",
  "base-layer-warm-underwear-2": "base-layers",
  goggles: "goggles",
  headwear: "headwear",
  "bags-backpacks": "bags",
  belts: "belts",
  jewelry: "jewelry",
  "scarves-tubulars": "scarves",
  socks: "socks",
  "small-accessories": "accessories",
  safety: "safety",
  helmets: "helmets",
  "all-helmets": "helmets",
  "helmet-accessories": "helmet-accessories",
  "tools-maintenance": "tools",
};

const WC_PARENT_SLUGS = new Set([
  "motorcycles",
  "for-men",
  "for-women",
  "accessories",
  "helmets",
  "uncategorized",
  "other",
]);

const CATEGORY_PRIORITY: readonly ProductCategory[] = [
  "tools",
  "helmets",
  "helmet-accessories",
  "goggles",
  "headwear",
  "bags",
  "belts",
  "jewelry",
  "scarves",
  "socks",
  "safety",
  "accessories",
  "jackets",
  "vests",
  "pants",
  "gloves",
  "footwear",
  "hoodies",
  "t-shirts",
  "base-layers",
  "other",
];

export const ACCESSORY_CATEGORIES: readonly ProductCategory[] = [
  "goggles",
  "headwear",
  "bags",
  "belts",
  "jewelry",
  "scarves",
  "socks",
  "safety",
  "accessories",
  "helmet-accessories",
];

export const PROTECTION_CATEGORIES: readonly ProductCategory[] = [
  "helmets",
  "goggles",
  "safety",
  "helmet-accessories",
];

/** Preferred WooCommerce category slug for GraphQL `where.category` filters. */
export const CATEGORY_TO_WC_SLUG: Partial<
  Record<ProductCategory, string>
> = {
  jackets: "jackets-and-tags",
  vests: "vests-2",
  pants: "mens-pants",
  gloves: "gloves",
  footwear: "footwear",
  hoodies: "sweaters",
  "t-shirts": "t-shirts",
  "base-layers": "base-layer-warm-underwear",
  helmets: "helmets",
  "helmet-accessories": "helmet-accessories",
  goggles: "goggles",
  headwear: "headwear",
  bags: "bags-backpacks",
  belts: "belts",
  jewelry: "jewelry",
  scarves: "scarves-tubulars",
  socks: "socks",
  safety: "safety",
  accessories: "small-accessories",
  tools: "tools-maintenance",
};

export function mapWcSlugToCategory(slug: string): ProductCategory | undefined {
  if (WC_PARENT_SLUGS.has(slug)) {
    return undefined;
  }

  return WC_SLUG_TO_CATEGORY[slug];
}

export function pickBestCategory(
  candidates: readonly ProductCategory[],
): ProductCategory | undefined {
  for (const category of CATEGORY_PRIORITY) {
    if (candidates.includes(category)) {
      return category;
    }
  }

  return candidates[0];
}

export function inferCategoryFromName(name: string): ProductCategory | undefined {
  const lower = name.toLowerCase();

  if (/\bvest\b/.test(lower)) return "vests";
  if (/\bjacket\b/.test(lower)) return "jackets";
  if (/\bglove\b/.test(lower)) return "gloves";
  if (/\bpant\b|\bjean\b/.test(lower)) return "pants";
  if (/\bboot\b|\bshoe\b|\bfootwear\b/.test(lower)) return "footwear";
  if (/\bhelmet\b/.test(lower)) return "helmets";
  if (/\bgoggle\b|\bglasses\b/.test(lower)) return "goggles";
  if (/\bhoodie\b|\bsweater\b|\bsweatshirt\b/.test(lower)) return "hoodies";
  if (/\bt-shirt\b|\btee\b|\bjersey\b/.test(lower)) return "t-shirts";
  if (/\bcap\b|\bhat\b|\bbeanie\b/.test(lower)) return "headwear";
  if (/\bbag\b|\bbackpack\b/.test(lower)) return "bags";
  if (/\bbelt\b/.test(lower)) return "belts";
  if (/\bscarf\b|\btubular\b|\bbandana\b/.test(lower)) return "scarves";
  if (/\bsock\b/.test(lower)) return "socks";
  if (/\bprotect/i.test(lower)) return "safety";

  return undefined;
}

export function resolveCategoryFromWcNodes(
  slugs: readonly string[],
  productName: string,
): ProductCategory {
  const mapped = slugs
    .map((slug) => mapWcSlugToCategory(slug))
    .filter((category): category is ProductCategory => category !== undefined);

  return (
    pickBestCategory(mapped) ??
    inferCategoryFromName(productName) ??
    "other"
  );
}
