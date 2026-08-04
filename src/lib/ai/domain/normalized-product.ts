import type { Locale } from "@/i18n/config";
import type { ProductCategory, ProductType } from "@/types/catalog-product";

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

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
