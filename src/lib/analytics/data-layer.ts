import { canSendAnalyticsEvents } from "@/lib/analytics/consent";
import type { Ga4EcommercePayload } from "@/lib/analytics/types";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function ensureDataLayer() {
  if (typeof window === "undefined") {
    return null;
  }

  window.dataLayer = window.dataLayer ?? [];
  return window.dataLayer;
}

const META_DATALAYER_KEYS = [
  "meta_content_ids",
  "meta_content_type",
  "meta_currency",
  "meta_value",
  "meta_transaction_id",
] as const;

function resetMetaDataLayerKeys() {
  return Object.fromEntries(META_DATALAYER_KEYS.map((key) => [key, undefined]));
}

export function pushDataLayerEvent(
  event: string,
  payload: Record<string, unknown> = {},
) {
  if (!canSendAnalyticsEvents()) {
    return;
  }

  const dataLayer = ensureDataLayer();
  if (!dataLayer) {
    return;
  }

  // Clear ecommerce + meta so GTM does not keep stale list ids from view_item_list.
  dataLayer.push({ ecommerce: null, ...resetMetaDataLayerKeys() });
  dataLayer.push({
    event,
    ...payload,
  });
}

function metaPayloadFromEcommerce(ecommerce: Ga4EcommercePayload) {
  const contentIds = ecommerce.items
    .map((item) => String(item.item_id).trim())
    .filter(Boolean);

  if (contentIds.length === 0) {
    return {};
  }

  return {
    meta_content_type: "product",
    meta_content_ids: contentIds,
    ...(ecommerce.currency ? { meta_currency: ecommerce.currency } : {}),
    ...(ecommerce.value != null ? { meta_value: ecommerce.value } : {}),
    ...(ecommerce.transaction_id
      ? { meta_transaction_id: ecommerce.transaction_id }
      : {}),
  };
}

export function pushEcommerceEvent(
  event: string,
  ecommerce: Ga4EcommercePayload,
  extra: Record<string, unknown> = {},
) {
  // Meta ViewContent must match a single catalog SKU/variation — never a grid impression.
  const includeMeta = event !== "view_item_list";

  pushDataLayerEvent(event, {
    ecommerce,
    ...(includeMeta ? metaPayloadFromEcommerce(ecommerce) : {}),
    ...extra,
  });
}

const PURCHASE_DEDUP_PREFIX = "motorock_analytics_purchase:";

export function hasTrackedPurchase(transactionId: string) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return (
      window.sessionStorage.getItem(`${PURCHASE_DEDUP_PREFIX}${transactionId}`) ===
      "1"
    );
  } catch {
    return false;
  }
}

export function markPurchaseTracked(transactionId: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      `${PURCHASE_DEDUP_PREFIX}${transactionId}`,
      "1",
    );
  } catch {
    // Ignore storage failures.
  }
}
