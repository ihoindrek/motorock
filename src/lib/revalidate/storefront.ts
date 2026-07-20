import { revalidatePath, revalidateTag } from "next/cache";
import { buildToolsCategoryHref } from "@/lib/shop/shop-category-route";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";
import { buildBrandCatalogHref } from "@/lib/shop/brand-url";

const LOCALES = ["en", "et"] as const;

/** Purge WooCommerce-tagged fetch cache and ISR pages across the storefront. */
export function revalidateStorefront() {
  revalidateTag("woocommerce", "max");
  revalidateTag("categories", "max");
  revalidateTag("sitemap", "max");
  revalidatePath("/sitemap.xml");
  revalidatePath("/sitemaps/main.xml");
  revalidatePath("/robots.txt");

  for (const locale of LOCALES) {
    revalidateTag(`homepage-${locale}`, "max");
    revalidatePath(`/${locale}`);
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
