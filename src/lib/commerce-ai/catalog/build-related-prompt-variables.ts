import type { Locale } from "@/i18n/config";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";
import type { CatalogProduct } from "@/types/catalog-product";
import {
  formatCandidateCatalog,
  formatCurrentProduct,
} from "@/lib/commerce-ai/catalog/fetch-related-candidates";
import type { RelatedProductCandidate } from "@/lib/commerce-ai/catalog/schemas";

export function buildRelatedProductsPromptVariables(input: {
  locale: Locale;
  product: NormalizedProduct;
  catalogProduct: CatalogProduct;
  candidates: readonly RelatedProductCandidate[];
}) {
  return {
    locale: input.locale,
    currentProduct: formatCurrentProduct(input.product, input.catalogProduct),
    candidateCatalog: formatCandidateCatalog(input.candidates),
  };
}
