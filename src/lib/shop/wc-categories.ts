import type { ProductCategory, ProductGender } from "@/types/catalog-product";

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

/** WPML ET category slugs → canonical EN slugs used for filters and matching. */
export const WC_SLUG_CANONICAL: Record<string, string> = {
  tarvikud: "accessories",
  "kotid-ja-seljakotid": "bags-backpacks",
  "aluskiht-soe-aluspesu-2": "base-layer-warm-underwear-2",
  "aluskiht-soe-aluspesu": "base-layer-warm-underwear",
  rihmad: "belts",
  "jalatsid-2": "footwear-2",
  jalatsid: "footwear",
  meestele: "for-men",
  naistele: "for-women",
  "prillid-prillid": "goggles",
  "kindad-2": "gloves-2",
  kindad: "gloves",
  peakatted: "headwear",
  "kiivri-tarvikud": "helmet-accessories",
  "koik-kiivrid": "all-helmets",
  kiivrid: "helmets",
  "kapuutsid-ja-kampsunid": "sweaters",
  "kapuutsid-ja-dressipluusid": "hoodies-sweatshirts",
  "jakid-ja-tagid": "jackets-and-tags-2",
  "jakid-tagid": "jackets-and-tags",
  ehted: "jewelry",
  mootorrattad: "motorcycles",
  muu: "other",
  "puksid-ja-teksad": "pants-jeans",
  "puksid-ja-teksad-2": "mens-pants",
  turvalisus: "safety",
  "sallid-ja-torukesed": "scarves-tubulars",
  "vaikesed-tarvikud": "small-accessories",
  sokid: "socks",
  "t-sargid-ja-trikood": "t-shirts-jerseys",
  "t-sargid-ja-sargid": "t-shirts",
  "tooriistad-ja-hooldus": "tools-maintenance",
  "vestid-2": "vests-3",
  vestid: "vests-2",
};

export function canonicalizeWcCategorySlug(slug: string): string {
  return WC_SLUG_CANONICAL[slug] ?? slug;
}

export function canonicalizeWcCategorySlugs(
  slugs: readonly string[] | undefined,
): readonly string[] {
  if (!slugs?.length) {
    return [];
  }

  return [...new Set(slugs.map(canonicalizeWcCategorySlug))];
}

/**
 * Collect WooCommerce category slugs for a product, including parent slugs.
 * Needed so routes like `for-women` match products assigned only to child
 * categories (e.g. `pants-jeans`).
 */
export function collectProductWcCategorySlugs(
  nodes: readonly {
    slug: string;
    parent?: { node?: { slug?: string | null } | null } | null;
  }[],
): readonly string[] {
  const slugs: string[] = [];

  for (const node of nodes) {
    if (node.slug) {
      slugs.push(node.slug);
    }

    const parentSlug = node.parent?.node?.slug;
    if (parentSlug) {
      slugs.push(parentSlug);
    }
  }

  return canonicalizeWcCategorySlugs(slugs);
}

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

/** Woo slugs used for protection / accessories branch filters (routing). */
export const HELMET_WC_SLUGS = new Set([
  "helmets",
  "all-helmets",
  "helmet-accessories",
  "kiivrid",
  "koik-kiivrid",
  "kiivri-tarvikud",
]);

export const PROTECTION_WC_SLUGS = new Set([
  "helmets",
  "all-helmets",
  "helmet-accessories",
  "goggles",
  "safety",
]);

export const ACCESSORIES_BRANCH_WC_SLUGS = new Set([
  "accessories",
  "goggles",
  "headwear",
  "bags-backpacks",
  "belts",
  "jewelry",
  "scarves-tubulars",
  "socks",
  "safety",
  "small-accessories",
]);

export const TOOLS_WC_SLUG = "tools-maintenance";

/** Leaf Woo slugs under `for-men` — paired with {@link WOMEN_GEAR_LEAF_WC_SLUGS}. */
export const MEN_GEAR_LEAF_WC_SLUGS = new Set([
  "jackets-and-tags",
  "mens-pants",
  "vests-2",
  "gloves",
  "footwear",
  "sweaters",
  "t-shirts",
  "base-layer-warm-underwear",
]);

/** Leaf Woo slugs under `for-women` — paired with {@link MEN_GEAR_LEAF_WC_SLUGS}. */
export const WOMEN_GEAR_LEAF_WC_SLUGS = new Set([
  "jackets-and-tags-2",
  "pants-jeans",
  "vests-3",
  "gloves-2",
  "footwear-2",
  "hoodies-sweatshirts",
  "t-shirts-jerseys",
  "base-layer-warm-underwear-2",
]);

export function productHasOppositeGenderGearSlug(
  wcCategorySlugs: readonly string[] | undefined,
  gender: Exclude<ProductGender, "unisex">,
): boolean {
  const slugs = canonicalizeWcCategorySlugs(wcCategorySlugs);

  if (gender === "men") {
    return slugs.some((slug) => WOMEN_GEAR_LEAF_WC_SLUGS.has(slug));
  }

  return slugs.some((slug) => MEN_GEAR_LEAF_WC_SLUGS.has(slug));
}

export function productNameIndicatesGender(name: string): ProductGender | undefined {
  if (/\bunisex\b/i.test(name)) {
    return "unisex";
  }

  if (/\bwomen'?s\b|\bfor women\b|\bladies'?s?\b|\bnaiste\b/i.test(name)) {
    return "women";
  }

  if (/\bmen'?s\b|\bfor men\b|\bmeeste\b/i.test(name)) {
    return "men";
  }

  return undefined;
}

export function isGenderGearLeafRoute(
  routeWcCategorySlug: string | undefined,
  gender: ProductGender | undefined,
  wcCategoryPath: readonly string[] | undefined,
): boolean {
  if (!routeWcCategorySlug || !gender || gender === "unisex") {
    return false;
  }

  if (routeWcCategorySlug === "for-men" || routeWcCategorySlug === "for-women") {
    return false;
  }

  return (wcCategoryPath?.length ?? 0) > 1;
}

export function productMatchesWcCategoryRoute(
  wcCategorySlugs: readonly string[] | undefined,
  routeWcCategorySlug: string | undefined,
) {
  if (!routeWcCategorySlug || !wcCategorySlugs?.length) {
    return true;
  }

  return wcCategorySlugs.includes(routeWcCategorySlug);
}

export function productInProtectionBranch(
  wcCategorySlugs: readonly string[] | undefined,
) {
  return wcCategorySlugs?.some((slug) => PROTECTION_WC_SLUGS.has(slug)) ?? false;
}

export function productInAccessoriesBranch(
  wcCategorySlugs: readonly string[] | undefined,
) {
  return (
    wcCategorySlugs?.some((slug) => ACCESSORIES_BRANCH_WC_SLUGS.has(slug)) ?? false
  );
}

export function productInToolsCategory(wcCategorySlugs: readonly string[] | undefined) {
  return wcCategorySlugs?.includes(TOOLS_WC_SLUG) ?? false;
}

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

export function resolveProductSubcategorySlugs(
  wcCategorySlugs: readonly string[] | undefined,
): readonly string[] {
  if (!wcCategorySlugs?.length) {
    return [];
  }

  return wcCategorySlugs
    .map(canonicalizeWcCategorySlug)
    .filter((slug) => !WC_PARENT_SLUGS.has(slug));
}

function subcategoryMatchKeys(product: {
  category: ProductCategory;
  wcCategorySlugs?: readonly string[];
}): Set<string> {
  const slugs = resolveProductSubcategorySlugs(product.wcCategorySlugs);
  if (slugs.length > 0) {
    return new Set(slugs);
  }

  const fallback = CATEGORY_TO_WC_SLUG[product.category];
  if (fallback) {
    return new Set([fallback]);
  }

  return new Set([product.category]);
}

export function productsShareWcSubcategory(
  a: {
    type: "equipment" | "motorcycle";
    category: ProductCategory;
    brand?: string;
    wcCategorySlugs?: readonly string[];
  },
  b: {
    type: "equipment" | "motorcycle";
    category: ProductCategory;
    brand?: string;
    wcCategorySlugs?: readonly string[];
  },
): boolean {
  if (a.type !== b.type) {
    return false;
  }

  if (a.type === "motorcycle") {
    const aKeys = subcategoryMatchKeys(a);
    const bKeys = subcategoryMatchKeys(b);

    if (aKeys.size > 0 && bKeys.size > 0) {
      for (const key of aKeys) {
        if (bKeys.has(key)) {
          return true;
        }
      }

      return false;
    }

    return a.brand === b.brand;
  }

  const aKeys = subcategoryMatchKeys(a);
  const bKeys = subcategoryMatchKeys(b);

  for (const key of aKeys) {
    if (bKeys.has(key)) {
      return true;
    }
  }

  return false;
}

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
    .map(canonicalizeWcCategorySlug)
    .map((slug) => mapWcSlugToCategory(slug))
    .filter((category): category is ProductCategory => category !== undefined);

  return (
    pickBestCategory(mapped) ??
    inferCategoryFromName(productName) ??
    "other"
  );
}
