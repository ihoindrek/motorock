import { describe, expect, it } from "vitest";
import {
  buildWooPaymentsCheckoutMetaData,
  expandWooPaymentsPaymentGateways,
  isWooPaymentsGateway,
  parseWooPaymentsConfirmRedirect,
  resolveWooPaymentsCheckoutGatewayId,
  toStripePaymentMethodBillingDetails,
  WOO_PAYMENTS_APPLE_PAY_GATEWAY_ID,
  WOO_PAYMENTS_CARD_GATEWAY_ID,
  WOO_PAYMENTS_EXCLUDED_STRIPE_PAYMENT_METHODS,
  WOO_PAYMENTS_GATEWAY_ID,
  WOO_PAYMENTS_GOOGLE_PAY_GATEWAY_ID,
} from "@/lib/checkout/woo-payments";
import type { PaymentGateway } from "@/lib/graphql/checkout";

describe("isWooPaymentsGateway", () => {
  it("matches WooCommerce Payments gateway ids", () => {
    expect(isWooPaymentsGateway(WOO_PAYMENTS_GATEWAY_ID)).toBe(true);
    expect(isWooPaymentsGateway(WOO_PAYMENTS_APPLE_PAY_GATEWAY_ID)).toBe(true);
    expect(isWooPaymentsGateway(WOO_PAYMENTS_GOOGLE_PAY_GATEWAY_ID)).toBe(true);
    expect(isWooPaymentsGateway(WOO_PAYMENTS_CARD_GATEWAY_ID)).toBe(true);
    expect(isWooPaymentsGateway("wc_montonio_card")).toBe(false);
  });
});

describe("resolveWooPaymentsCheckoutGatewayId", () => {
  it("maps UI gateway ids to WooPayments checkout id", () => {
    expect(resolveWooPaymentsCheckoutGatewayId(WOO_PAYMENTS_APPLE_PAY_GATEWAY_ID)).toBe(
      WOO_PAYMENTS_GATEWAY_ID,
    );
    expect(resolveWooPaymentsCheckoutGatewayId("wc_montonio_card")).toBe(
      "wc_montonio_card",
    );
  });
});

describe("expandWooPaymentsPaymentGateways", () => {
  const wooGateway: PaymentGateway = {
    id: WOO_PAYMENTS_GATEWAY_ID,
    title: "WooPayments",
    description: "",
  };

  it("splits WooPayments into wallet and card rows", () => {
    expect(
      expandWooPaymentsPaymentGateways([wooGateway], {
        applePay: true,
        googlePay: false,
      }),
    ).toEqual([
      { ...wooGateway, id: WOO_PAYMENTS_APPLE_PAY_GATEWAY_ID },
      { ...wooGateway, id: WOO_PAYMENTS_CARD_GATEWAY_ID },
    ]);
  });
});

describe("WOO_PAYMENTS_EXCLUDED_STRIPE_PAYMENT_METHODS", () => {
  it("excludes Klarna until EUR is enabled in Stripe", () => {
    expect(WOO_PAYMENTS_EXCLUDED_STRIPE_PAYMENT_METHODS).toContain("klarna");
  });
});

describe("buildWooPaymentsCheckoutMetaData", () => {
  it("maps Stripe confirmation token and locale for GraphQL checkout", () => {
    expect(
      buildWooPaymentsCheckoutMetaData({
        stripeConfirmationToken: "ctoken_123",
        fraudPreventionToken: "abc",
        locale: "et",
      }),
    ).toEqual([
      { key: "wcpay_confirmation_token", value: "ctoken_123" },
      { key: "checkout_locale", value: "et" },
      { key: "wcpay_fraud_prevention_token", value: "abc" },
    ]);
  });

  it("maps Stripe payment method for express checkout", () => {
    expect(
      buildWooPaymentsCheckoutMetaData({
        stripePaymentMethodId: "pm_123",
        locale: "en",
      }),
    ).toEqual([
      { key: "wcpay_payment_method", value: "pm_123" },
      { key: "checkout_locale", value: "en" },
    ]);
  });
});

describe("parseWooPaymentsConfirmRedirect", () => {
  it("parses WooPayments 3DS redirect hashes", () => {
    expect(
      parseWooPaymentsConfirmRedirect(
        "#wcpay-confirm-pi:123:pi_abc_secret_xyz:nonce123",
      ),
    ).toEqual({
      kind: "pi",
      orderId: "123",
      clientSecret: "pi_abc_secret_xyz",
      nonce: "nonce123",
      intentId: "pi_abc",
    });
  });
});

describe("toStripePaymentMethodBillingDetails", () => {
  it("includes empty state for EU countries", () => {
    expect(
      toStripePaymentMethodBillingDetails({
        name: "Test User",
        email: "test@example.com",
        address: {
          line1: "Test 1",
          city: "Tallinn",
          postal_code: "10111",
          country: "EE",
        },
      }).address,
    ).toEqual({
      line1: "Test 1",
      city: "Tallinn",
      postal_code: "10111",
      country: "EE",
      state: "",
    });
  });

  it("falls back to city for countries that require state", () => {
    expect(
      toStripePaymentMethodBillingDetails({
        name: "Test User",
        email: "test@example.com",
        address: {
          line1: "123 Main St",
          city: "Anytown",
          postal_code: "12345",
          country: "US",
        },
      }).address?.state,
    ).toBe("Anytown");
  });
});
