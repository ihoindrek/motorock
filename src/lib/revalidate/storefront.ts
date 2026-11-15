import { revalidatePath, revalidateTag } from "next/cache";
import {
  buildProductHref,
  LEGACY_PRODUCT_PATH_PREFIX,
} from "@/lib/shop/product-url";

const LOCALES = ["en", "et"] as const;

export function productCacheTag(slug: string) {
  return `product-${slug}`;
}

/** Purge one product's fetch cache and ISR pages. */
export function revalidateWooProduct(slug: string) {
  revalidateTag(productCacheTag(slug), "max");

  for (const locale of LOCALES) {
    revalidatePath(`/${locale}${buildProductHref(slug, locale)}`);
    revalidatePath(`/${locale}${LEGACY_PRODUCT_PATH_PREFIX}/${slug}`);
  }
}

/** Refresh shared catalog/homepage/sitemap caches without invalidating every fetch. */
export function revalidateWooCatalogTags() {
  revalidateTag("categories", "max");
  revalidateTag("motorcycle-catalog", "max");
  revalidateTag("equipment-catalog", "max");
  revalidateTag("size-guides", "max");
  revalidateTag("sitemap", "max");
  revalidatePath("/sitemap.xml");
  revalidatePath("/sitemaps/main.xml");

  for (const locale of LOCALES) {
    revalidateTag(`homepage-${locale}`, "max");
    revalidatePath(`/${locale}`);
  }
}

/**
 * Purge WooCommerce-tagged fetch cache and shared hub pages.
 * Avoids layout-wide revalidatePath storms (major ISR write cost on Vercel).
 */
export function revalidateStorefront() {
  revalidateTag("woocommerce", "max");
  revalidateWooCatalogTags();
  revalidatePath("/robots.txt");

  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/blog`);
    revalidatePath(`/${locale}/search`);
  }
}
