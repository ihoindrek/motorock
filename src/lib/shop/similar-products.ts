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

export function pickSimilarProducts(
  current: CatalogProduct,
  catalog: readonly CatalogProduct[],
  limit = RELATED_PRODUCTS_LIMIT,
): CatalogProduct[] {
  const ranked = catalog
    .filter(
      (candidate) =>
        candidate.slug !== current.slug &&
        productsShareWcSubcategory(current, candidate),
    )
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
