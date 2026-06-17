import type { CatalogProduct } from "@/types/catalog-product";

const PLACEHOLDER_IMAGE = "/brixton-image.webp";
const DEFAULT_LIMIT = 4;

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

  if (candidate.category === current.category) {
    score += 10;
  }

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
  limit = DEFAULT_LIMIT,
): CatalogProduct[] {
  const picked: CatalogProduct[] = [];
  const seen = new Set<string>();

  const ranked = catalog
    .filter(
      (candidate) =>
        candidate.slug !== current.slug && candidate.type === current.type,
    )
    .map((candidate) => ({
      candidate,
      score: similarityScore(current, candidate),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.candidate.name.localeCompare(b.candidate.name);
    });

  for (const { candidate } of ranked) {
    if (picked.length >= limit) {
      break;
    }

    seen.add(candidate.slug);
    picked.push(candidate);
  }

  if (picked.length < limit) {
    for (const candidate of catalog) {
      if (picked.length >= limit) {
        break;
      }

      if (
        candidate.slug === current.slug ||
        seen.has(candidate.slug) ||
        candidate.type !== current.type ||
        candidate.category !== current.category
      ) {
        continue;
      }

      seen.add(candidate.slug);
      picked.push(candidate);
    }
  }

  return picked;
}
