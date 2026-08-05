import { isLocale, type Locale } from "@/i18n/config";
import { getWooInternalSecret } from "@/lib/woocommerce/internal-secret";

type WpmlSlugAlternatesResponse = {
  ok?: boolean;
  alternates?: Partial<Record<string, string>>;
};

/** Fallback when WooGraphQL WPML translations resolve to variations/null. */
export async function fetchWpmlProductSlugAlternates(
  productId: number,
): Promise<Partial<Record<Locale, string>>> {
  const secret = getWooInternalSecret();
  const baseUrl = process.env.WOOCOMMERCE_STORE_URL?.replace(/\/$/, "");

  if (!secret || !baseUrl || productId <= 0) {
    return {};
  }

  try {
    const endpoint = new URL(
      `/wp-json/motorock/v1/product-slug-alternates/${productId}`,
      baseUrl,
    );

    const response = await fetch(endpoint.toString(), {
      headers: { "X-Motorock-Internal-Secret": secret },
      next: { revalidate: 300, tags: ["woocommerce", "product-slug-alternates"] },
    });

    if (!response.ok) {
      return {};
    }

    const body = (await response.json()) as WpmlSlugAlternatesResponse;
    const alternates: Partial<Record<Locale, string>> = {};

    for (const [locale, slug] of Object.entries(body.alternates ?? {})) {
      if (isLocale(locale) && typeof slug === "string" && slug.trim()) {
        alternates[locale] = slug.trim();
      }
    }

    return alternates;
  } catch {
    return {};
  }
}
