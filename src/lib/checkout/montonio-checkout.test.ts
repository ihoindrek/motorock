import { describe, expect, it } from "vitest";
import {
  buildMontonioCheckoutMetaData,
  needsMontonioPaymentRemint,
  pickupPointReadyForCheckout,
  resolveMontonioCheckoutGatewayId,
  shouldRunMontonioPaymentRemint,
} from "@/lib/checkout/montonio-checkout";
import { MONTONIO_PAYMENT_METHOD_ID } from "@/lib/graphql/checkout";
import type { MontonioPaymentOption } from "@/types/montonio-payment";

describe("resolveMontonioCheckoutGatewayId", () => {
  it("maps any Montonio UI gateway to wc_montonio_payments", () => {
    expect(resolveMontonioCheckoutGatewayId("wc_montonio_card")).toBe(
      MONTONIO_PAYMENT_METHOD_ID,
    );
    expect(resolveMontonioCheckoutGatewayId("wc_montonio_payments")).toBe(
      MONTONIO_PAYMENT_METHOD_ID,
    );
  });

  it("passes through non-Montonio gateways", () => {
    expect(resolveMontonioCheckoutGatewayId("bacs")).toBe("bacs");
  });
});

describe("needsMontonioPaymentRemint", () => {
  it("requires remint for card, blik, bnpl and hire purchase", () => {
    expect(
      needsMontonioPaymentRemint({
        kind: "card",
        code: "card",
        systemName: "cardPayments",
      } as MontonioPaymentOption),
    ).toBe(true);
    expect(
      needsMontonioPaymentRemint({
        kind: "bank",
        code: "LHVBEE22",
        systemName: "paymentInitiation",
      } as MontonioPaymentOption),
    ).toBe(false);
  });
});

describe("shouldRunMontonioPaymentRemint", () => {
  it("runs remint only for Montonio gateways with card-like options", () => {
    const cardOption = {
      kind: "card",
      code: "card",
      systemName: "cardPayments",
    } as MontonioPaymentOption;

    expect(
      shouldRunMontonioPaymentRemint("wc_montonio_card", cardOption),
    ).toBe(true);
    expect(shouldRunMontonioPaymentRemint("ppcp-gateway", cardOption)).toBe(
      false,
    );
    expect(shouldRunMontonioPaymentRemint("wc_montonio_card", null)).toBe(false);
  });
});

describe("buildMontonioCheckoutMetaData", () => {
  it("writes bank meta for payment initiation", () => {
    const meta = buildMontonioCheckoutMetaData({
      locale: "et",
      country: "EE",
      montonioOption: {
        kind: "bank",
        code: "LHVBEE22",
        systemName: "paymentInitiation",
      } as MontonioPaymentOption,
    });

    expect(meta).toEqual(
      expect.arrayContaining([
        { key: "checkout_locale", value: "et" },
        { key: "montonio_preferred_provider", value: "paymentInitiation" },
        { key: "montonio_payments_preselected_bank", value: "LHVBEE22" },
        { key: "montonio_payments_preferred_country", value: "EE" },
      ]),
    );
  });

  it("writes card provider meta for card gateway fallback", () => {
    const meta = buildMontonioCheckoutMetaData({
      paymentGatewayId: "wc_montonio_card",
    });

    expect(meta).toEqual([
      { key: "montonio_preferred_provider", value: "cardPayments" },
    ]);
  });

  it("ignores Montonio option meta when payment gateway is PayPal", () => {
    const meta = buildMontonioCheckoutMetaData({
      paymentGatewayId: "ppcp-gateway",
      montonioOption: {
        kind: "card",
        code: "card",
        systemName: "cardPayments",
      } as MontonioPaymentOption,
    });

    expect(meta).toEqual([]);
  });
});

describe("pickupPointReadyForCheckout", () => {
  it("requires montonioItemId", () => {
    expect(
      pickupPointReadyForCheckout({
        id: "1",
        name: "Test",
        address: "Test 1",
        city: "Tallinn",
        postcode: "10111",
        carrier: "omniva",
        montonioItemId: "uuid-123",
      }),
    ).toBe(true);
    expect(
      pickupPointReadyForCheckout({
        id: "1",
        name: "Test",
        address: "Test 1",
        city: "Tallinn",
        postcode: "10111",
        carrier: "omniva",
      }),
    ).toBe(false);
  });
});
