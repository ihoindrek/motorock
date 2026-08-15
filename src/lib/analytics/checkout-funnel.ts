import { pushDataLayerEvent } from "@/lib/analytics/data-layer";

export type CheckoutFunnelEvent =
  | "checkout_country_selected"
  | "checkout_shipping_rates_loaded"
  | "checkout_shipping_rates_failed"
  | "checkout_submit_blocked"
  | "checkout_payment_return"
  | "checkout_draft_restored";

export function trackCheckoutFunnelEvent(
  event: CheckoutFunnelEvent,
  params: Record<string, string | number | boolean | null | undefined> = {},
) {
  pushDataLayerEvent(event, params);
}

export function trackCheckoutCountrySelected(countryCode: string) {
  trackCheckoutFunnelEvent("checkout_country_selected", {
    country_code: countryCode.trim().toUpperCase(),
  });
}

export function trackCheckoutShippingRatesLoaded(input: {
  countryCode: string;
  rateCount: number;
}) {
  trackCheckoutFunnelEvent("checkout_shipping_rates_loaded", {
    country_code: input.countryCode.trim().toUpperCase(),
    rate_count: input.rateCount,
  });
}

export function trackCheckoutShippingRatesFailed(input: {
  countryCode?: string;
  reason: string;
}) {
  trackCheckoutFunnelEvent("checkout_shipping_rates_failed", {
    country_code: input.countryCode?.trim().toUpperCase() || undefined,
    reason: input.reason,
  });
}

export function trackCheckoutSubmitBlocked(reason: string) {
  trackCheckoutFunnelEvent("checkout_submit_blocked", {
    reason,
  });
}

export function trackCheckoutPaymentReturn(input: {
  outcome: "redirect" | "error" | "resume";
  error?: string;
}) {
  trackCheckoutFunnelEvent("checkout_payment_return", {
    outcome: input.outcome,
    error: input.error,
  });
}

export function trackCheckoutDraftRestored(input: {
  hadPayment: boolean;
  hadPickup: boolean;
}) {
  trackCheckoutFunnelEvent("checkout_draft_restored", {
    had_payment: input.hadPayment,
    had_pickup: input.hadPickup,
  });
}
