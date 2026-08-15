import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  trackCheckoutCountrySelected,
  trackCheckoutDraftRestored,
  trackCheckoutPaymentReturn,
  trackCheckoutShippingRatesFailed,
  trackCheckoutShippingRatesLoaded,
  trackCheckoutSubmitBlocked,
} from "@/lib/analytics/checkout-funnel";

const pushDataLayerEvent = vi.fn();

vi.mock("@/lib/analytics/data-layer", () => ({
  pushDataLayerEvent: (...args: unknown[]) => pushDataLayerEvent(...args),
}));

describe("checkout funnel analytics", () => {
  beforeEach(() => {
    pushDataLayerEvent.mockClear();
  });

  it("tracks country selection", () => {
    trackCheckoutCountrySelected("ee");

    expect(pushDataLayerEvent).toHaveBeenCalledWith("checkout_country_selected", {
      country_code: "EE",
    });
  });

  it("tracks loaded shipping rates", () => {
    trackCheckoutShippingRatesLoaded({ countryCode: "FI", rateCount: 4 });

    expect(pushDataLayerEvent).toHaveBeenCalledWith(
      "checkout_shipping_rates_loaded",
      {
        country_code: "FI",
        rate_count: 4,
      },
    );
  });

  it("tracks failed shipping rates", () => {
    trackCheckoutShippingRatesFailed({
      countryCode: "EE",
      reason: "zero_rates",
    });

    expect(pushDataLayerEvent).toHaveBeenCalledWith(
      "checkout_shipping_rates_failed",
      {
        country_code: "EE",
        reason: "zero_rates",
      },
    );
  });

  it("tracks submit blocks and payment return", () => {
    trackCheckoutSubmitBlocked("Choose a payment method.");
    trackCheckoutPaymentReturn({ outcome: "error", error: "Payment cancelled" });
    trackCheckoutDraftRestored({ hadPayment: true, hadPickup: false });

    expect(pushDataLayerEvent).toHaveBeenNthCalledWith(1, "checkout_submit_blocked", {
      reason: "Choose a payment method.",
    });
    expect(pushDataLayerEvent).toHaveBeenNthCalledWith(2, "checkout_payment_return", {
      outcome: "error",
      error: "Payment cancelled",
    });
    expect(pushDataLayerEvent).toHaveBeenNthCalledWith(3, "checkout_draft_restored", {
      had_payment: true,
      had_pickup: false,
    });
  });
});
