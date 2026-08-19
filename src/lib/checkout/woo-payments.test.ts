import { describe, expect, it } from "vitest";
import {
  buildWooPaymentsCheckoutMetaData,
  isWooPaymentsGateway,
  WOO_PAYMENTS_EXCLUDED_STRIPE_PAYMENT_METHODS,
  WOO_PAYMENTS_GATEWAY_ID,
} from "@/lib/checkout/woo-payments";

describe("isWooPaymentsGateway", () => {
  it("matches WooCommerce Payments gateway id", () => {
    expect(isWooPaymentsGateway(WOO_PAYMENTS_GATEWAY_ID)).toBe(true);
    expect(isWooPaymentsGateway("wc_montonio_card")).toBe(false);
  });
});

describe("WOO_PAYMENTS_EXCLUDED_STRIPE_PAYMENT_METHODS", () => {
  it("excludes Klarna until EUR is enabled in Stripe", () => {
    expect(WOO_PAYMENTS_EXCLUDED_STRIPE_PAYMENT_METHODS).toContain("klarna");
  });
});

describe("buildWooPaymentsCheckoutMetaData", () => {
  it("maps Stripe payment method and locale for GraphQL checkout", () => {
    expect(
      buildWooPaymentsCheckoutMetaData({
        stripePaymentMethodId: "pm_123",
        fraudPreventionToken: "abc",
        locale: "et",
      }),
    ).toEqual([
      { key: "wcpay_payment_method", value: "pm_123" },
      { key: "checkout_locale", value: "et" },
      { key: "wcpay_fraud_prevention_token", value: "abc" },
    ]);
  });
});
