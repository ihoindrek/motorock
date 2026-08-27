import { revalidatePath, revalidateTag } from "next/cache";
import { buildToolsCategoryHref } from "@/lib/shop/shop-category-route";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";
import { buildBrandCatalogHref } from "@/lib/shop/brand-url";
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

/** Purge WooCommerce-tagged fetch cache and ISR pages across the storefront. */
export function revalidateStorefront() {
  revalidateTag("woocommerce", "max");
  revalidateWooCatalogTags();
  revalidatePath("/robots.txt");

  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/blog`);
    revalidatePath(`/${locale}/search`);
    revalidatePath(`/${locale}/cart`);
    revalidatePath(`/${locale}/shop`, "layout");
    revalidatePath(`/${locale}/shop/product`, "layout");
    revalidatePath(`/${locale}/product`, "layout");
    revalidatePath(`/${locale}/toode`, "layout");
    revalidatePath(`/${locale}/shop/equipment`, "layout");
    revalidatePath(`/${locale}/tootekategooria`, "layout");
    revalidatePath(`/${locale}/shop/brands`, "layout");
    revalidatePath(`/${locale}/brand`, "layout");
    revalidatePath(`/${locale}/brandid`, "layout");
    revalidatePath(`/${locale}/shop/motorcycles`);
    revalidatePath(`/${locale}/shop/tools`);
    revalidatePath(`/${locale}${buildToolsCategoryHref(locale)}`);
    revalidatePath(`/${locale}${buildEquipmentHubHref(locale)}`);
  }
}
