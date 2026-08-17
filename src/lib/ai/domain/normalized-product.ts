import type { Locale } from "@/i18n/config";
import type { ProductCategory, ProductType } from "@/types/catalog-product";
import type { ProductFaqItem } from "@/lib/ai/core/types";
import type { AiContentStatus } from "@/lib/ai/domain/content-section";
import { matchesLocaleHeuristic } from "@/lib/ai/domain/locale-heuristic";

export type NormalizedProductAttribute = {
  name: string;
  slug: string;
  values: string[];
  isVariation: boolean;
};

export type NormalizedProductImage = {
  id?: number;
  url: string;
  altText?: string;
};

export type NormalizedProductTranslation = {
  productId: number;
  locale: Locale;
  slug: string;
};

export type NormalizedProduct = {
  productId: number;
  locale: Locale;
  slug: string;
  sku?: string;
  name: string;
  brand?: string;
  productType: ProductType;
  category?: ProductCategory;
  categoryPath: string[];
  price: number;
  currency: "EUR";
  inStock: boolean;
  attributes: NormalizedProductAttribute[];
  variations: {
    sku?: string;
    attributes: Record<string, string>;
    price?: number;
    inStock: boolean;
  }[];
  images: NormalizedProductImage[];
  existing: {
    shortDescription?: string;
    description?: string;
    seoTitle?: string;
    seoMetaDescription?: string;
    seoKeywords?: string[];
    faq?: ProductFaqItem[];
    contentStatus?: AiContentStatus;
  };
  translations: NormalizedProductTranslation[];
  source: "shopify" | "manual" | "unknown";
  modifiedAt?: string;
};

export type ProductContentSnapshot = Pick<
  NormalizedProduct["existing"],
  "shortDescription" | "description"
>;

export function hasExistingDescriptionContent(
  existing: ProductContentSnapshot,
  locale?: Locale,
): boolean {
  const shortPlain = stripHtml(existing.shortDescription ?? "");
  const longPlain = stripHtml(existing.description ?? "");

  if (shortPlain.length < 40 || longPlain.length < 200) {
    return false;
  }

  if (!locale) {
    return true;
  }

  return matchesLocaleHeuristic(`${shortPlain} ${longPlain}`, locale);
}

export function hasExistingSeoContent(
  existing: ProductContentSnapshot & {
    seoTitle?: string;
    seoMetaDescription?: string;
  },
  locale?: Locale,
) {
  const title = existing.seoTitle?.trim() ?? "";
  const meta = existing.seoMetaDescription?.trim() ?? "";

  if (!title || meta.length < 80) {
    return false;
  }

  if (!locale) {
    return true;
  }

  return matchesLocaleHeuristic(`${title} ${meta}`, locale);
}

export function hasExistingFaqContent(
  existing: { faq?: ProductFaqItem[] },
  locale?: Locale,
) {
  if (
    !Array.isArray(existing.faq) ||
    existing.faq.length < 3 ||
    !existing.faq.every(
      (item) => item.question.trim().length >= 10 && item.answer.trim().length >= 20,
    )
  ) {
    return false;
  }

  if (!locale) {
    return true;
  }

  const sample = existing.faq
    .map((item) => `${item.question} ${item.answer}`)
    .join(" ");

  return matchesLocaleHeuristic(sample, locale);
}

export function hasExistingAltTextContent(product: Pick<NormalizedProduct, "images">) {
  if (product.images.length === 0) {
    return false;
  }

  return product.images.every((image) => (image.altText?.trim().length ?? 0) >= 20);
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
