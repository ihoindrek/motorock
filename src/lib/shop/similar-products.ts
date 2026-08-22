import type { CatalogProduct, ProductCategory } from "@/types/catalog-product";
import type { MotorcycleProduct } from "@/types/motorcycle-product";
import {
  CATEGORY_TO_WC_SLUG,
  productsShareWcSubcategory,
  resolveProductSubcategorySlugs,
} from "@/lib/shop/wc-categories";

const PLACEHOLDER_IMAGE = "/brixton-image.webp";
export const RELATED_PRODUCTS_LIMIT = 6;
export const SIMILAR_MOTORCYCLE_POOL_LIMIT = 48;
export const SIMILAR_EQUIPMENT_POOL_LIMIT = 80;

export type SimilarProductsCatalogWhere = {
  category?: string;
  categoryNotIn?: string[];
};

export function resolveSimilarProductsCatalogWhere(
  product: CatalogProduct,
): SimilarProductsCatalogWhere {
  if (product.type === "motorcycle") {
    return { category: "motorcycles" };
  }

  const subcategories = resolveProductSubcategorySlugs(product.wcCategorySlugs);
  const leaf = subcategories.at(-1);

  if (leaf) {
    return { category: leaf };
  }

  const mapped = CATEGORY_TO_WC_SLUG[product.category as ProductCategory];
  if (mapped) {
    return { category: mapped };
  }

  if (product.shopAudiences?.includes("women")) {
    return { category: "for-women" };
  }

  if (product.shopAudiences?.includes("men")) {
    return { category: "for-men" };
  }

  return { categoryNotIn: ["motorcycles", "tools-maintenance"] };
}

export function similarProductsPoolLimit(product: CatalogProduct) {
  return product.type === "motorcycle"
    ? SIMILAR_MOTORCYCLE_POOL_LIMIT
    : SIMILAR_EQUIPMENT_POOL_LIMIT;
}

export function buildMotorcycleSimilarAnchor(
  motorcycle: Pick<MotorcycleProduct, "slug" | "sync" | "databaseId">,
): CatalogProduct {
  const image = motorcycle.sync.images[0] ?? PLACEHOLDER_IMAGE;

  return {
    slug: motorcycle.slug,
    databaseId: motorcycle.databaseId,
    name: motorcycle.sync.name,
    brand: motorcycle.sync.brand,
    price: motorcycle.sync.price,
    regularPrice: motorcycle.sync.regularPrice,
    image,
    lifestyleImage: image,
    type: "motorcycle",
    gender: "unisex",
    category: "motorcycles",
    sizes: [],
    colors: [...motorcycle.sync.colors],
    inStock: motorcycle.sync.inStock,
    isNew: false,
    tagline: "",
    description: "",
    specs: [],
    features: [],
    backHref: "/",
    backLabel: "",
  };
}

function gendersCompatible(
  a: CatalogProduct["gender"],
  b: CatalogProduct["gender"],
) {
  return a === b || a === "unisex" || b === "unisex";
}

function similarityScore(
  current: CatalogProduct,
  candidate: CatalogProduct,
): number {
  let score = 0;

  if (candidate.brand === current.brand) {
    score += 8;
  }

  if (current.type === "motorcycle" && current.price > 0 && candidate.price > 0) {
    const ratio =
      Math.min(current.price, candidate.price) / Math.max(current.price, candidate.price);
    score += Math.round(ratio * 5);
  }

  if (gendersCompatible(current.gender, candidate.gender)) {
    score += 3;
  }

  if (candidate.inStock) {
    score += 2;
  }

  if (candidate.price > 0 && candidate.image !== PLACEHOLDER_IMAGE) {
    score += 1;
  }

  return score;
}

export function isSimilarCatalogCandidate(
  current: CatalogProduct,
  candidate: CatalogProduct,
): boolean {
  if (candidate.slug === current.slug || candidate.type !== current.type) {
    return false;
  }

  if (current.type === "motorcycle") {
    return true;
  }

  return productsShareWcSubcategory(current, candidate);
}

export function pickSimilarProducts(
  current: CatalogProduct,
  catalog: readonly CatalogProduct[],
  limit = RELATED_PRODUCTS_LIMIT,
): CatalogProduct[] {
  const ranked = catalog
    .filter((candidate) => isSimilarCatalogCandidate(current, candidate))
    .map((candidate) => ({
      candidate,
      score: similarityScore(current, candidate),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.candidate.name.localeCompare(b.candidate.name);
    });

  return ranked.slice(0, limit).map(({ candidate }) => candidate);
}
