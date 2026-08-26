import type { Ga4Item } from "@/lib/analytics/types";
import { getGtmId, isConsentEnabled } from "@/lib/consent/config";
import { readStoredConsent } from "@/lib/consent/storage";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

declare global {
  interface Window {
    _learnq?: unknown[][];
  }
}

export function canSendKlaviyoEvents() {
  if (!getGtmId()) {
    return false;
  }

  if (!isConsentEnabled()) {
    return true;
  }

  return readStoredConsent()?.marketing === true;
}

function ensureLearnq() {
  if (typeof window === "undefined") {
    return false;
  }

  window._learnq = window._learnq ?? [];
  return true;
}

function ga4ItemToKlaviyoProduct(item: Ga4Item) {
  const price = Number(item.price) || 0;
  const quantity = item.quantity ?? 1;

  const payload: Record<string, unknown> = {
    ProductName: String(item.item_name || ""),
    ProductID: String(item.item_id || ""),
    SKU: String(item.item_id || ""),
    Price: price,
    CompareAtPrice: price,
    URL: typeof window !== "undefined" ? window.location.href : undefined,
  };

  if (item.item_category) {
    payload.Categories = [String(item.item_category)];
  }

  if (item.item_brand) {
    payload.Brand = String(item.item_brand);
  }

  return { payload, price, quantity };
}

function pushKlaviyoTrack(metric: string, properties: Record<string, unknown>) {
  if (!canSendKlaviyoEvents() || !ensureLearnq()) {
    return;
  }

  window._learnq!.push(["track", metric, properties]);
}

export function trackKlaviyoViewedProduct(item: Ga4Item) {
  const { payload } = ga4ItemToKlaviyoProduct(item);
  pushKlaviyoTrack("Viewed Product", payload);
}

export function trackKlaviyoAddedToCart(item: Ga4Item) {
  const { payload, price, quantity } = ga4ItemToKlaviyoProduct(item);
  pushKlaviyoTrack("Added to Cart", {
    ...payload,
    Quantity: quantity,
    RowTotal: price * quantity,
  });
}

export function trackKlaviyoStartedCheckout(input: {
  items: readonly Ga4Item[];
  value?: number;
}) {
  if (input.items.length === 0) {
    return;
  }

  const names: string[] = [];
  const categories: string[] = [];

  for (const item of input.items) {
    if (item.item_name) {
      names.push(String(item.item_name));
    }

    if (
      item.item_category &&
      !categories.includes(String(item.item_category))
    ) {
      categories.push(String(item.item_category));
    }
  }

  pushKlaviyoTrack("Started Checkout", {
    $value: input.value ?? 0,
    ItemNames: names,
    CheckoutURL: typeof window !== "undefined" ? window.location.href : undefined,
    Categories: categories,
    ItemCount: input.items.length,
  });
}

export function normalizeKlaviyoEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isKlaviyoIdentifiableEmail(email: string) {
  const normalized = normalizeKlaviyoEmail(email);
  return normalized.length > 0 && EMAIL_PATTERN.test(normalized);
}

/** Links anonymous onsite activity to a profile once checkout email is known. */
export function identifyKlaviyoProfile(email: string) {
  if (!canSendKlaviyoEvents() || !ensureLearnq()) {
    return;
  }

  const normalized = normalizeKlaviyoEmail(email);
  if (!EMAIL_PATTERN.test(normalized)) {
    return;
  }

  window._learnq!.push(["identify", { $email: normalized, email: normalized }]);
}
