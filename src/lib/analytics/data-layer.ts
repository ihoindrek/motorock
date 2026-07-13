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

  dataLayer.push({ ecommerce: null });
  dataLayer.push({
    event,
    ...payload,
  });
}

export function pushEcommerceEvent(
  event: string,
  ecommerce: Ga4EcommercePayload,
  extra: Record<string, unknown> = {},
) {
  pushDataLayerEvent(event, {
    ecommerce,
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
