import type { Locale } from "@/i18n/config";
import type { CatalogProduct } from "@/types/catalog-product";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";
import { getEquipmentCatalog, getMotorcycleCatalog } from "@/lib/graphql/products";
import { productsShareWcSubcategory } from "@/lib/shop/wc-categories";
import type { RelatedProductCandidate } from "@/lib/commerce-ai/catalog/schemas";

const MAX_CANDIDATES = 50;

function toCandidate(product: CatalogProduct): RelatedProductCandidate {
  return {
    slug: product.slug,
    name: product.name,
    brand: product.brand || undefined,
    price: product.price,
    inStock: product.inStock,
    category: product.category,
    type: product.type,
  };
}

function candidateScore(current: CatalogProduct, candidate: CatalogProduct): number {
  let score = 0;

  if (candidate.brand === current.brand) {
    score += 6;
  }

  if (candidate.inStock) {
    score += 3;
  }

  if (current.price > 0 && candidate.price > 0) {
    const ratio = Math.min(current.price, candidate.price) / Math.max(current.price, candidate.price);
    score += Math.round(ratio * 4);
  }

  return score;
}

export async function fetchRelatedCandidates(input: {
  locale: Locale;
  current: CatalogProduct;
}): Promise<RelatedProductCandidate[]> {
  const catalog =
    input.current.type === "motorcycle"
      ? await getMotorcycleCatalog(input.locale)
      : await getEquipmentCatalog(input.locale);

  return catalog
    .filter(
      (candidate) =>
        candidate.slug !== input.current.slug &&
        productsShareWcSubcategory(input.current, candidate),
    )
    .map((candidate) => ({
      candidate,
      score: candidateScore(input.current, candidate),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.candidate.name.localeCompare(b.candidate.name);
    })
    .slice(0, MAX_CANDIDATES)
    .map(({ candidate }) => toCandidate(candidate));
}

export function formatCandidateCatalog(candidates: readonly RelatedProductCandidate[]): string {
  if (candidates.length === 0) {
    return "(no candidates)";
  }

  return candidates
    .map((candidate) => {
      const parts = [
        candidate.slug,
        candidate.brand ?? "—",
        candidate.name,
        `${candidate.price} EUR`,
        candidate.inStock ? "in stock" : "out of stock",
        candidate.category,
      ];

      return parts.join(" | ");
    })
    .join("\n");
}

export function formatCurrentProduct(
  product: NormalizedProduct,
  catalogProduct: CatalogProduct,
): string {
  const lines = [
    `slug: ${product.slug}`,
    `name: ${product.name}`,
    `brand: ${product.brand ?? "—"}`,
    `type: ${product.productType}`,
    `category: ${product.category ?? catalogProduct.category}`,
    `price: ${product.price} EUR`,
    `in stock: ${product.inStock ? "yes" : "no"}`,
  ];

  if (product.existing.shortDescription) {
    lines.push(`short: ${stripHtml(product.existing.shortDescription).slice(0, 200)}`);
  }

  return lines.join("\n");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function resolveCatalogProductForNormalized(input: {
  locale: Locale;
  normalized: NormalizedProduct;
}): Promise<CatalogProduct | null> {
  const catalog =
    input.normalized.productType === "motorcycle"
      ? await getMotorcycleCatalog(input.locale)
      : await getEquipmentCatalog(input.locale);

  return catalog.find((product) => product.slug === input.normalized.slug) ?? null;
}
