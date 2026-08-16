import type { CatalogProduct } from "@/types/catalog-product";
import {
  mergeSuggestionCandidates,
  pickCartComplementaryProducts,
} from "@/lib/shop/cart-complementary-products";
import { pickSimilarProducts } from "@/lib/shop/similar-products";

export function pickCuratedRelatedProducts(
  anchor: CatalogProduct,
  related: readonly CatalogProduct[],
  excludeSlugs: ReadonlySet<string>,
  limit = 6,
): CatalogProduct[] {
  const picked: CatalogProduct[] = [];

  for (const candidate of related) {
    if (picked.length >= limit) {
      break;
    }

    if (candidate.slug === anchor.slug || excludeSlugs.has(candidate.slug)) {
      continue;
    }

    picked.push(candidate);
  }

  return picked;
}

export function resolveCartSuggestions(input: {
  anchor: CatalogProduct;
  catalog: readonly CatalogProduct[];
  curatedRelated?: readonly CatalogProduct[];
  excludeSlugs?: ReadonlySet<string>;
  cartCategories?: ReadonlySet<CatalogProduct["category"]>;
  limit?: number;
}): CatalogProduct[] {
  const excludeSlugs = input.excludeSlugs ?? new Set<string>();
  const cartCategories = input.cartCategories ?? new Set<CatalogProduct["category"]>();
  const limit = input.limit ?? 6;

  let suggestions = input.curatedRelated?.length
    ? pickCuratedRelatedProducts(input.anchor, input.curatedRelated, excludeSlugs, limit)
    : [];

  if (suggestions.length < limit && input.anchor.type === "equipment") {
    suggestions = mergeSuggestionCandidates(
      input.anchor,
      suggestions,
      pickCartComplementaryProducts(input.anchor, input.catalog, {
        excludeSlugs,
        cartCategories,
        limit,
      }),
      {
        excludeSlugs,
        cartCategories,
        limit,
      },
    );
  }

  if (suggestions.length < limit) {
    suggestions = mergeSuggestionCandidates(
      input.anchor,
      suggestions,
      pickSimilarProducts(input.anchor, input.catalog, 12),
      {
        excludeSlugs,
        cartCategories,
        limit,
      },
    );
  }

  if (input.anchor.type === "motorcycle" && suggestions.length === 0) {
    suggestions = pickSimilarProducts(input.anchor, input.catalog, limit);
  }

  return suggestions.slice(0, limit);
}
