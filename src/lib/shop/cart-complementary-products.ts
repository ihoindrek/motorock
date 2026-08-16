import type { CatalogProduct, ProductCategory } from "@/types/catalog-product";

const PLACEHOLDER_IMAGE = "/brixton-image.webp";

/** Outfit pieces that pair well when the anchor item is from another category. */
export const COMPLEMENTARY_BY_CATEGORY: Partial<
  Record<ProductCategory, readonly ProductCategory[]>
> = {
  jackets: [
    "pants",
    "t-shirts",
    "hoodies",
    "gloves",
    "footwear",
    "base-layers",
    "vests",
    "headwear",
  ],
  vests: ["pants", "t-shirts", "jackets", "hoodies", "gloves", "footwear"],
  pants: ["jackets", "vests", "t-shirts", "hoodies", "gloves", "footwear", "belts"],
  hoodies: ["pants", "jackets", "t-shirts", "gloves", "footwear", "base-layers"],
  "t-shirts": ["jackets", "pants", "hoodies", "vests", "gloves", "footwear"],
  "base-layers": ["jackets", "pants", "hoodies", "gloves", "footwear"],
  gloves: ["jackets", "pants", "t-shirts", "helmets", "goggles", "footwear"],
  footwear: ["pants", "jackets", "socks", "gloves", "t-shirts"],
  helmets: ["goggles", "gloves", "jackets", "helmet-accessories", "headwear"],
  goggles: ["helmets", "gloves", "headwear", "jackets"],
  headwear: ["jackets", "gloves", "goggles", "t-shirts"],
  socks: ["footwear", "pants", "gloves"],
  belts: ["pants", "jackets", "footwear"],
  bags: ["gloves", "jackets", "headwear"],
  accessories: ["gloves", "headwear", "socks", "goggles"],
};

function gendersCompatible(
  a: CatalogProduct["gender"],
  b: CatalogProduct["gender"],
) {
  return a === b || a === "unisex" || b === "unisex";
}

function complementaryPriority(
  anchorCategory: ProductCategory,
  candidateCategory: ProductCategory,
) {
  const preferred = COMPLEMENTARY_BY_CATEGORY[anchorCategory];
  if (!preferred) {
    return 0;
  }

  const index = preferred.indexOf(candidateCategory);
  return index >= 0 ? preferred.length - index : 0;
}

function scoreComplementaryCandidate(
  anchor: CatalogProduct,
  candidate: CatalogProduct,
  blockedCategories: ReadonlySet<ProductCategory>,
  strict: boolean,
) {
  if (candidate.slug === anchor.slug || candidate.type !== anchor.type) {
    return -1;
  }

  if (candidate.category === anchor.category) {
    return -1;
  }

  if (blockedCategories.has(candidate.category)) {
    return -1;
  }

  if (!gendersCompatible(anchor.gender, candidate.gender)) {
    return -1;
  }

  let score = complementaryPriority(anchor.category, candidate.category);

  if (strict && score === 0) {
    return -1;
  }

  if (score === 0) {
    score = 1;
  }

  if (candidate.brand === anchor.brand) {
    score += 8;
  }

  if (candidate.inStock) {
    score += 2;
  }

  if (candidate.price > 0 && candidate.image !== PLACEHOLDER_IMAGE) {
    score += 1;
  }

  return score;
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

  const rank = (strict: boolean) =>
    catalog
      .filter((candidate) => !excludeSlugs.has(candidate.slug))
      .map((candidate) => ({
        candidate,
        score: scoreComplementaryCandidate(
          anchor,
          candidate,
          blockedCategories,
          strict,
        ),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return left.candidate.name.localeCompare(right.candidate.name);
      })
      .map((entry) => entry.candidate);

  const strictMatches = rank(true);
  if (strictMatches.length >= limit) {
    return strictMatches.slice(0, limit);
  }

  const picked = new Map(strictMatches.map((product) => [product.slug, product]));
  for (const candidate of rank(false)) {
    if (picked.size >= limit) {
      break;
    }

    if (!picked.has(candidate.slug)) {
      picked.set(candidate.slug, candidate);
    }
  }

  return [...picked.values()];
}
