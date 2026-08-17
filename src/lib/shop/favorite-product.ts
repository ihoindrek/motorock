import type { FavoriteProduct } from "@/components/riders-favorites-carousel";
import type { HomepageSpotlightConfig } from "@/data/homepage-spotlight";
import type { Locale } from "@/i18n/config";
import type { CatalogProduct, ProductCategory } from "@/types/catalog-product";
import type { CategoryRoute } from "@/lib/shop/category";
import { filterProductsByRoute } from "@/lib/shop/category";
import { productInHomepageAccessoriesTab } from "@/lib/shop/wc-categories";

export type PopularGearAudience = "men" | "women" | "accessories";

function wcAudienceRoute(
  wcCategorySlug: string,
  options: Partial<CategoryRoute> = {},
): CategoryRoute {
  return {
    title: "",
    description: "",
    breadcrumbs: [],
    wcCategorySlug,
    ...options,
  };
}

const popularGearRoutes = {
  men: wcAudienceRoute("for-men", { gender: "men" }),
  women: wcAudienceRoute("for-women", { gender: "women" }),
  accessories: wcAudienceRoute("accessories", { accessoriesOnly: true }),
} as const;

const WOMEN_GEAR_CATEGORY_PRIORITY: readonly ProductCategory[] = [
  "jackets",
  "pants",
  "gloves",
  "hoodies",
  "footwear",
  "vests",
  "base-layers",
  "t-shirts",
];

const WOMEN_CATEGORY_LIMITS: Partial<Record<ProductCategory, number>> = {
  jackets: 3,
  "t-shirts": 1,
};

/** Assigns each product to a single Popular Gear tab (accessories → men → women). */
export function partitionPopularGearByAudience(rawByAudience: Record<
  PopularGearAudience,
  readonly CatalogProduct[]
>): Record<PopularGearAudience, CatalogProduct[]> {
  const accessories = filterProductsByRoute(
    rawByAudience.accessories,
    popularGearRoutes.accessories,
  );
  const accessorySlugs = new Set(accessories.map((product) => product.slug));

  const men = filterProductsByRoute(rawByAudience.men, popularGearRoutes.men).filter(
    (product) => !accessorySlugs.has(product.slug),
  );
  const menSlugs = new Set(men.map((product) => product.slug));

  const women = filterProductsByRoute(
    rawByAudience.women,
    popularGearRoutes.women,
  ).filter(
    (product) =>
      !accessorySlugs.has(product.slug) && !menSlugs.has(product.slug),
  );

  return { men, women, accessories };
}

export function filterHomepageAccessoriesProducts(
  products: readonly CatalogProduct[],
): CatalogProduct[] {
  return products.filter((product) =>
    productInHomepageAccessoriesTab(product.wcCategorySlugs),
  );
}

const PLACEHOLDER_IMAGE = "/brixton-image.webp";
const NEW_GEAR_POOL_SIZE = 32;

function publishedAtTimestamp(product: CatalogProduct) {
  if (!product.publishedAt) {
    return 0;
  }

  const parsed = Date.parse(product.publishedAt);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compareByNewest(left: CatalogProduct, right: CatalogProduct) {
  return publishedAtTimestamp(right) - publishedAtTimestamp(left);
}

function stableDailySeed(audience: PopularGearAudience, locale: Locale) {
  const day = new Date().toISOString().slice(0, 10);
  return `${locale}:${audience}:${day}`;
}

function hashString(input: string) {
  let hash = 2_166_136_261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
}

function seededShuffle<T>(items: readonly T[], seed: string) {
  const copy = [...items];
  let state = hashString(seed);

  for (let index = copy.length - 1; index > 0; index -= 1) {
    state = (Math.imul(1_664_525, state) + 1_013_904_223) >>> 0;
    const swapIndex = state % (index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function isEligibleFavorite(product: CatalogProduct): boolean {
  if (product.price <= 0 || !product.image || product.image === PLACEHOLDER_IMAGE) {
    return false;
  }

  if (/gift\s*card|e-gift/i.test(product.name) || product.slug.includes("gift-card")) {
    return false;
  }

  return true;
}

function womenProductLineKey(product: CatalogProduct): string {
  return product.name
    .replace(/\s*\([^)]+\)\s*/g, " ")
    .replace(
      /\s+(black|white|grey|gray|blue|red|green|purple|orange|yellow|beige|camo|olive|teal|sand|cream|charcoal|khaki|natural|matte gold)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function scoreWomenProduct(product: CatalogProduct): number {
  const categoryScore: Partial<Record<ProductCategory, number>> = {
    jackets: 30,
    pants: 28,
    gloves: 24,
    hoodies: 20,
    footwear: 18,
    vests: 16,
    "base-layers": 14,
    "t-shirts": 6,
    other: 8,
  };

  let score = categoryScore[product.category] ?? 4;

  if (product.brand === "Motogirl") {
    score += 12;
  }

  if (/women|womens/i.test(product.name)) {
    score += 10;
  }

  if (product.brand === "Pando Moto" && /women/i.test(product.name)) {
    score += 14;
  }

  if (product.shopAudiences?.length === 1 && product.shopAudiences[0] === "women") {
    score += 6;
  }

  if (product.category === "t-shirts" && /unisex/i.test(product.name)) {
    score -= 12;
  }

  if (/leather|armored|armoured|cordura|armalith/i.test(product.name)) {
    score += 8;
  }

  if (
    product.category === "other" &&
    /jean|legging|cargo|trouser/i.test(product.name)
  ) {
    score += 20;
  }

  return score;
}

function pickWomenPopularGear(
  products: readonly CatalogProduct[],
  limit: number,
): CatalogProduct[] {
  const ranked = products
    .filter(isEligibleFavorite)
    .sort((a, b) => scoreWomenProduct(b) - scoreWomenProduct(a));

  const picked: CatalogProduct[] = [];
  const lineKeys = new Set<string>();
  const categoryCounts = new Map<ProductCategory, number>();

  const tryPick = (product: CatalogProduct) => {
    if (picked.length >= limit || picked.some((item) => item.slug === product.slug)) {
      return false;
    }

    const categoryLimit = WOMEN_CATEGORY_LIMITS[product.category];
    const currentCount = categoryCounts.get(product.category) ?? 0;
    if (categoryLimit != null && currentCount >= categoryLimit) {
      return false;
    }

    const lineKey = womenProductLineKey(product);
    if (lineKeys.has(lineKey)) {
      return false;
    }

    picked.push(product);
    lineKeys.add(lineKey);
    categoryCounts.set(product.category, currentCount + 1);
    return true;
  };

  for (const category of WOMEN_GEAR_CATEGORY_PRIORITY) {
    const bestInCategory = ranked.find((product) => product.category === category);
    if (bestInCategory) {
      tryPick(bestInCategory);
    }
    if (picked.length >= limit) {
      return picked;
    }
  }

  for (const product of ranked) {
    tryPick(product);
    if (picked.length >= limit) {
      break;
    }
  }

  return picked;
}

export function pickHomepageWomenGear(
  womenCatalog: readonly CatalogProduct[],
  limit: number,
): FavoriteProduct[] {
  const fromWomenCategory = filterProductsByRoute(
    womenCatalog,
    popularGearRoutes.women,
  ).filter(isEligibleFavorite);

  const pool =
    fromWomenCategory.length >= 4
      ? fromWomenCategory
      : womenCatalog.filter(isEligibleFavorite);

  return pool.slice(0, limit).map(catalogToFavoriteProduct);
}

export function catalogToFavoriteProduct(
  product: CatalogProduct,
): FavoriteProduct {
  return {
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    image: product.image,
  };
}

export function pickFavoriteProducts(
  products: readonly CatalogProduct[],
  limit: number,
): FavoriteProduct[] {
  return products
    .filter(isEligibleFavorite)
    .slice(0, limit)
    .map(catalogToFavoriteProduct);
}

export function pickHomepageNewGearProducts(
  audience: PopularGearAudience,
  products: readonly CatalogProduct[],
  locale: Locale,
  limit: number,
): FavoriteProduct[] {
  const pool = products
    .filter(isEligibleFavorite)
    .sort(compareByNewest)
    .slice(0, NEW_GEAR_POOL_SIZE);

  return seededShuffle(pool, stableDailySeed(audience, locale))
    .slice(0, limit)
    .map(catalogToFavoriteProduct);
}

function matchesSpotlightCategory(
  product: CatalogProduct,
  categories: readonly ProductCategory[],
  wcCategorySlugs: readonly string[],
) {
  return (
    categories.includes(product.category) ||
    (product.wcCategorySlugs ?? []).some((slug) => wcCategorySlugs.includes(slug))
  );
}

function matchesSpotlightBrand(product: CatalogProduct, brands?: readonly string[]) {
  if (!brands?.length) {
    return true;
  }

  return brands.includes(product.brand);
}

function pickSpotlightWithBrandDiversity(
  products: readonly CatalogProduct[],
  limit: number,
) {
  const picked: CatalogProduct[] = [];
  const pickedSlugs = new Set<string>();
  const brandCounts = new Map<string, number>();

  const tryPick = (product: CatalogProduct, maxPerBrand: number) => {
    if (picked.length >= limit || pickedSlugs.has(product.slug)) {
      return false;
    }

    const brandCount = brandCounts.get(product.brand) ?? 0;
    if (brandCount >= maxPerBrand) {
      return false;
    }

    picked.push(product);
    pickedSlugs.add(product.slug);
    brandCounts.set(product.brand, brandCount + 1);
    return true;
  };

  for (const product of products) {
    tryPick(product, 1);
    if (picked.length >= limit) {
      return picked;
    }
  }

  for (const product of products) {
    tryPick(product, Number.POSITIVE_INFINITY);
    if (picked.length >= limit) {
      break;
    }
  }

  return picked;
}

export function pickHomepageSpotlightProducts(
  spotlight: Pick<
    HomepageSpotlightConfig,
    "id" | "categories" | "wcCategorySlugs" | "brands" | "limit"
  >,
  products: readonly CatalogProduct[],
  locale: Locale,
): FavoriteProduct[] {
  const pool = products
    .filter(isEligibleFavorite)
    .filter((product) =>
      matchesSpotlightCategory(product, spotlight.categories, spotlight.wcCategorySlugs),
    )
    .filter((product) => matchesSpotlightBrand(product, spotlight.brands));

  const shuffled = seededShuffle(
    pool,
    `${stableDailySeed("men", locale)}:${spotlight.id}`,
  );

  const selected = spotlight.brands?.length
    ? shuffled.slice(0, spotlight.limit)
    : pickSpotlightWithBrandDiversity(shuffled, spotlight.limit);

  return selected.map(catalogToFavoriteProduct);
}

export function pickPopularGearProducts(
  audience: PopularGearAudience,
  products: readonly CatalogProduct[],
  limit: number,
): FavoriteProduct[] {
  if (audience === "women") {
    return pickWomenPopularGear(products, limit).map(catalogToFavoriteProduct);
  }

  return pickFavoriteProducts(products, limit);
}
