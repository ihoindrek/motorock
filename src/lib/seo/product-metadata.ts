import type { Locale } from "@/i18n/config";
import { getStorefrontUrl } from "@/lib/storefront/url";
import {
  buildProductSeoDescription,
  buildProductSeoTitle,
} from "@/lib/seo/product-seo-copy";
import { localizedProductHref } from "@/lib/shop/product-url";
import type { CatalogProduct, ProductCategory } from "@/types/catalog-product";
import type { MotorcycleProduct } from "@/types/motorcycle-product";

export type ProductSeoSnapshot = {
  name: string;
  description?: string;
  image?: string;
  images: string[];
  sku?: string;
  brand?: string;
  category?: ProductCategory;
  price: number;
  inStock: boolean;
  slug: string;
  canonicalUrl: string;
  /** Search-result title (without site suffix). */
  seoTitle: string;
  /** Search-result / Open Graph description. */
  seoDescription: string;
};

function stripHtml(text: string) {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueImages(images: Array<string | undefined | null>) {
  const seen = new Set<string>();

  return images.filter((image): image is string => {
    const trimmed = image?.trim();
    if (!trimmed || seen.has(trimmed)) {
      return false;
    }

    seen.add(trimmed);
    return true;
  });
}

function resolveMotorcycleDescription(product: MotorcycleProduct) {
  const candidates = [
    product.content.tagline,
    product.enrichment.tagline,
    product.sync.shortDescription,
    product.content.overviewSections[0]?.paragraphs[0],
  ];

  for (const candidate of candidates) {
    const text = candidate?.trim();
    if (text) {
      return stripHtml(text).slice(0, 320);
    }
  }

  return undefined;
}

function resolveCatalogDescription(product: CatalogProduct) {
  const candidates = [
    product.tagline,
    product.shortDescription,
    product.description,
    product.headline,
  ];

  for (const candidate of candidates) {
    const text = candidate?.trim();
    if (text) {
      return stripHtml(text).slice(0, 320);
    }
  }

  return undefined;
}

function withSeoCopy(
  snapshot: Omit<ProductSeoSnapshot, "seoTitle" | "seoDescription">,
  locale: Locale,
): ProductSeoSnapshot {
  const copyInput = {
    name: snapshot.name,
    brand: snapshot.brand,
    category: snapshot.category,
    price: snapshot.price,
    description: snapshot.description,
  };

  return {
    ...snapshot,
    seoTitle: buildProductSeoTitle(copyInput, locale),
    seoDescription: buildProductSeoDescription(copyInput, locale),
  };
}

export function buildProductSeoSnapshotFromMotorcycle(
  product: MotorcycleProduct,
  locale: Locale,
): ProductSeoSnapshot {
  const images = uniqueImages([
    product.sync.images[0],
    ...product.sync.variations.map((variation) => variation.image),
    ...(product.enrichment.lifestyleImages ?? []),
  ]);

  return withSeoCopy(
    {
      name: product.sync.name,
      description: resolveMotorcycleDescription(product),
      image: images[0],
      images,
      sku: product.sync.sku || undefined,
      brand: product.sync.brand || undefined,
      category: "motorcycles",
      price: product.sync.price,
      inStock: product.sync.inStock,
      slug: product.slug,
      canonicalUrl: `${getStorefrontUrl()}${localizedProductHref(product.slug, locale)}`,
    },
    locale,
  );
}

export function buildProductSeoSnapshotFromCatalog(
  product: CatalogProduct,
  locale: Locale,
): ProductSeoSnapshot {
  const images = uniqueImages([
    product.image,
    product.lifestyleImage,
    ...(product.gallery ?? []),
    ...(product.lifestyleImages ?? []),
    ...(product.variations ?? []).map((variation) => variation.image),
  ]);

  return withSeoCopy(
    {
      name: product.name,
      description: resolveCatalogDescription(product),
      image: images[0],
      images,
      sku: product.sku,
      brand: product.brand || undefined,
      category: product.category,
      price: product.price,
      inStock: product.inStock,
      slug: product.slug,
      canonicalUrl: `${getStorefrontUrl()}${localizedProductHref(product.slug, locale)}`,
    },
    locale,
  );
}

export function buildProductOpenGraphImages(snapshot: ProductSeoSnapshot) {
  if (!snapshot.image) {
    return undefined;
  }

  return [
    {
      url: snapshot.image,
      alt: snapshot.name,
    },
  ];
}
