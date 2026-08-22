import { runDebounced } from "@/lib/revalidate/debounce";
import {
  revalidateStorefront,
  revalidateWooCatalogTags,
  revalidateWooProduct,
} from "@/lib/revalidate/storefront";
import {
  extractProductSlug,
  isProductWebhookTopic,
  parseWooWebhookPayload,
} from "@/lib/revalidate/woocommerce-webhook";

const CATALOG_DEBOUNCE_KEY = "woocommerce-catalog";

export type WooWebhookRevalidateResult = {
  mode: "full" | "product" | "catalog" | "skipped";
  slug?: string;
  debounced: boolean;
};

export function revalidateFromWooWebhook(
  topic: string,
  payload: string,
): WooWebhookRevalidateResult {
  const parsed = parseWooWebhookPayload(payload);
  const slug = parsed ? extractProductSlug(parsed) : null;

  if (isProductWebhookTopic(topic) && slug) {
    revalidateWooProduct(slug);

    const debounced = !runDebounced(CATALOG_DEBOUNCE_KEY, revalidateWooCatalogTags);

    return {
      mode: "product",
      slug,
      debounced,
    };
  }

  const debounced = !runDebounced(CATALOG_DEBOUNCE_KEY, revalidateWooCatalogTags);

  return {
    mode: debounced ? "skipped" : "catalog",
    debounced,
  };
}

export function revalidateFromManualRequest() {
  revalidateStorefront();

  return {
    mode: "full" as const,
    debounced: false,
  };
}
