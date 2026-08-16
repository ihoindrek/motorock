import type { CatalogProduct, ProductCategory } from "@/types/catalog-product";

const PLACEHOLDER_IMAGE = "/brixton-image.webp";

/** Outfit pieces that pair well when the anchor item is from another category. */
export const COMPLEMENTARY_BY_CATEGORY: Partial<
  Record<ProductCategory, readonly ProductCategory[]>
> = {
  jackets: [
    "pants",
    "t-shirts",
    "gloves",
    "scarves",
    "headwear",
    "hoodies",
    "footwear",
    "base-layers",
    "vests",
    "goggles",
  ],
  vests: ["pants", "t-shirts", "jackets", "gloves", "scarves", "hoodies", "footwear"],
  pants: ["jackets", "vests", "t-shirts", "gloves", "footwear", "belts", "scarves"],
  hoodies: ["pants", "jackets", "t-shirts", "gloves", "scarves", "footwear", "base-layers"],
  "t-shirts": ["jackets", "pants", "gloves", "scarves", "hoodies", "vests", "footwear"],
  "base-layers": ["jackets", "pants", "hoodies", "gloves", "footwear"],
  gloves: ["jackets", "pants", "t-shirts", "scarves", "helmets", "goggles", "footwear"],
  footwear: ["pants", "jackets", "socks", "gloves", "t-shirts"],
  helmets: ["goggles", "gloves", "scarves", "jackets", "helmet-accessories", "headwear"],
  goggles: ["helmets", "gloves", "headwear", "scarves", "jackets"],
  headwear: ["jackets", "gloves", "goggles", "scarves", "t-shirts"],
  scarves: ["jackets", "gloves", "headwear", "t-shirts", "goggles"],
  socks: ["footwear", "pants", "gloves"],
  belts: ["pants", "jackets", "footwear"],
  bags: ["gloves", "jackets", "headwear", "scarves"],
  accessories: ["gloves", "headwear", "scarves", "socks", "goggles"],
};

function gendersCompatible(
  a: CatalogProduct["gender"],
  b: CatalogProduct["gender"],
) {
  return a === b || a === "unisex" || b === "unisex";
}

function brandsMatch(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function scoreCandidateInCategory(anchor: CatalogProduct, candidate: CatalogProduct) {
  let score = 0;

  if (brandsMatch(candidate.brand, anchor.brand)) {
    score += 100;
  }

  if (candidate.inStock) {
    score += 10;
  }

  if (candidate.price > 0 && candidate.image !== PLACEHOLDER_IMAGE) {
    score += 5;
  }

  if (candidate.isNew) {
    score += 1;
  }

  return score;
}

function pickBestForCategory(
  anchor: CatalogProduct,
  category: ProductCategory,
  catalog: readonly CatalogProduct[],
  excludeSlugs: ReadonlySet<string>,
) {
  const candidates = catalog.filter(
    (candidate) =>
      candidate.slug !== anchor.slug &&
      candidate.type === anchor.type &&
      candidate.category === category &&
      !excludeSlugs.has(candidate.slug) &&
      gendersCompatible(anchor.gender, candidate.gender),
  );

  if (candidates.length === 0) {
    return null;
  }

  return candidates
    .map((candidate) => ({
      candidate,
      score: scoreCandidateInCategory(anchor, candidate),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.candidate.name.localeCompare(right.candidate.name);
    })[0]?.candidate ?? null;
}

function buildCategoryOrder(
  anchorCategory: ProductCategory,
  catalog: readonly CatalogProduct[],
  blockedCategories: ReadonlySet<ProductCategory>,
) {
  const preferred = COMPLEMENTARY_BY_CATEGORY[anchorCategory] ?? [];
  const seen = new Set<ProductCategory>();
  const order: ProductCategory[] = [];

  for (const category of preferred) {
    if (blockedCategories.has(category) || seen.has(category)) {
      continue;
    }

    seen.add(category);
    order.push(category);
  }

  for (const product of catalog) {
    const category = product.category;

    if (
      blockedCategories.has(category) ||
      seen.has(category) ||
      category === "motorcycles" ||
      category === "tools" ||
      category === "other"
    ) {
      continue;
    }

    seen.add(category);
    order.push(category);
  }

  return order;
}

export function pickCartComplementaryProducts(
  anchor: CatalogProduct,
  catalog: readonly CatalogProduct[],
  options: {
    excludeSlugs?: ReadonlySet<string>;
    cartCategories?: ReadonlySet<ProductCategory>;
    limit?: number;
  } = {},
): CatalogProduct[] {
  const excludeSlugs = options.excludeSlugs ?? new Set<string>();
  const cartCategories = options.cartCategories ?? new Set<ProductCategory>();
  const limit = options.limit ?? 6;

  const blockedCategories = new Set(cartCategories);
  blockedCategories.add(anchor.category);

  const categoryOrder = buildCategoryOrder(
    anchor.category,
    catalog,
    blockedCategories,
  );

  const picked: CatalogProduct[] = [];

  for (const category of categoryOrder) {
    if (picked.length >= limit) {
      break;
    }

    const best = pickBestForCategory(anchor, category, catalog, excludeSlugs);

    if (best) {
      picked.push(best);
    }
  }

  return picked;
}

export function mergeSuggestionCandidates(
  anchor: CatalogProduct,
  primary: readonly CatalogProduct[],
  secondary: readonly CatalogProduct[],
  options: {
    excludeSlugs?: ReadonlySet<string>;
    cartCategories?: ReadonlySet<ProductCategory>;
    limit?: number;
  } = {},
): CatalogProduct[] {
  const excludeSlugs = options.excludeSlugs ?? new Set<string>();
  const cartCategories = options.cartCategories ?? new Set<ProductCategory>();
  const limit = options.limit ?? 6;

  const blockedCategories = new Set(cartCategories);
  blockedCategories.add(anchor.category);

  const picked: CatalogProduct[] = [];
  const usedSlugs = new Set<string>();
  const usedCategories = new Set<ProductCategory>();

  const consider = (candidate: CatalogProduct) => {
    if (picked.length >= limit) {
      return;
    }

    if (
      candidate.slug === anchor.slug ||
      candidate.type !== anchor.type ||
      excludeSlugs.has(candidate.slug) ||
      usedSlugs.has(candidate.slug) ||
      blockedCategories.has(candidate.category) ||
      usedCategories.has(candidate.category) ||
      !gendersCompatible(anchor.gender, candidate.gender)
    ) {
      return;
    }

    picked.push(candidate);
    usedSlugs.add(candidate.slug);
    usedCategories.add(candidate.category);
  };

  for (const candidate of primary) {
    consider(candidate);
  }

  const rankedSecondary = [...secondary]
    .filter(
      (candidate) =>
        !blockedCategories.has(candidate.category) &&
        !usedCategories.has(candidate.category),
    )
    .map((candidate) => ({
      candidate,
      score: scoreCandidateInCategory(anchor, candidate),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.candidate.name.localeCompare(right.candidate.name);
    });

  for (const entry of rankedSecondary) {
    consider(entry.candidate);
  }

  return picked;
}
