import type { Locale } from "@/i18n/config";
import { getStorefrontUrl } from "@/lib/storefront/url";
import { localizedProductHref } from "@/lib/shop/product-url";
import type { CatalogProduct } from "@/types/catalog-product";
import type { MotorcycleProduct } from "@/types/motorcycle-product";

export type ProductSeoSnapshot = {
  name: string;
  description?: string;
  image?: string;
  images: string[];
  sku?: string;
  brand?: string;
  price: number;
  inStock: boolean;
  slug: string;
  canonicalUrl: string;
};

function stripHtml(text: string) {
  return text
    .replace(/<[^>]+>/g, " ")
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

export function buildProductSeoSnapshotFromMotorcycle(
  product: MotorcycleProduct,
  locale: Locale,
): ProductSeoSnapshot {
  const images = uniqueImages([
    product.sync.images[0],
    ...product.sync.variations.map((variation) => variation.image),
    ...product.enrichment.lifestyleImages,
  ]);

  return {
    name: product.sync.name,
    description: resolveMotorcycleDescription(product),
    image: images[0],
    images,
    sku: product.sync.sku || undefined,
    brand: product.sync.brand || undefined,
    price: product.sync.price,
    inStock: product.sync.inStock,
    slug: product.slug,
    canonicalUrl: `${getStorefrontUrl()}${localizedProductHref(product.slug, locale)}`,
  };
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
    ...product.variations.map((variation) => variation.image),
  ]);

  return {
    name: product.name,
    description: resolveCatalogDescription(product),
    image: images[0],
    images,
    sku: product.sku,
    brand: product.brand || undefined,
    price: product.price,
    inStock: product.inStock,
    slug: product.slug,
    canonicalUrl: `${getStorefrontUrl()}${localizedProductHref(product.slug, locale)}`,
  };
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
