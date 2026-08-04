import type { Locale } from "@/i18n/config";
import type { ProductCategory, ProductType } from "@/types/catalog-product";
import type { ProductFaqItem } from "@/lib/ai/core/types";
import type { AiContentStatus } from "@/lib/ai/domain/content-section";

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
): boolean {
  const shortPlain = stripHtml(existing.shortDescription ?? "");
  const longPlain = stripHtml(existing.description ?? "");

  return shortPlain.length >= 40 && longPlain.length >= 200;
}

export function hasExistingSeoContent(existing: ProductContentSnapshot & {
  seoTitle?: string;
  seoMetaDescription?: string;
}) {
  return Boolean(
    existing.seoTitle?.trim() &&
      existing.seoMetaDescription?.trim() &&
      existing.seoMetaDescription.trim().length >= 80,
  );
}

export function hasExistingFaqContent(existing: { faq?: ProductFaqItem[] }) {
  return (
    Array.isArray(existing.faq) &&
    existing.faq.length >= 3 &&
    existing.faq.every(
      (item) => item.question.trim().length >= 10 && item.answer.trim().length >= 20,
    )
  );
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
