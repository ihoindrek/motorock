import type { CatalogProduct } from "@/types/catalog-product";
import { productsShareWcSubcategory } from "@/lib/shop/wc-categories";

const PLACEHOLDER_IMAGE = "/brixton-image.webp";
export const RELATED_PRODUCTS_LIMIT = 6;

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
