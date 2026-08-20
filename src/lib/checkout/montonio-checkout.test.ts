import { describe, expect, it } from "vitest";
import {
  buildMontonioCheckoutMetaData,
  inferMontonioOptionFromGateway,
  needsMontonioPaymentRemint,
  pickupPointReadyForCheckout,
  resolveMontonioCheckoutGatewayId,
  shouldRunMontonioPaymentRemint,
} from "@/lib/checkout/montonio-checkout";
import { MONTONIO_PAYMENT_METHOD_ID } from "@/lib/graphql/checkout";
import type { MontonioPaymentOption } from "@/types/montonio-payment";

describe("resolveMontonioCheckoutGatewayId", () => {
  it("keeps enabled Montonio gateway ids", () => {
    const enabled = [MONTONIO_PAYMENT_METHOD_ID, "wc_montonio_bnpl"];

    expect(
      resolveMontonioCheckoutGatewayId(MONTONIO_PAYMENT_METHOD_ID, enabled),
    ).toBe(MONTONIO_PAYMENT_METHOD_ID);
    expect(
      resolveMontonioCheckoutGatewayId("wc_montonio_bnpl", enabled),
    ).toBe("wc_montonio_bnpl");
  });

  it("maps synthetic Montonio gateways to the first enabled Woo gateway", () => {
    expect(
      resolveMontonioCheckoutGatewayId("wc_montonio_card", [
        MONTONIO_PAYMENT_METHOD_ID,
        "wc_montonio_bnpl",
      ]),
    ).toBe(MONTONIO_PAYMENT_METHOD_ID);
    expect(
      resolveMontonioCheckoutGatewayId("wc_montonio_card", ["wc_montonio_bnpl"]),
    ).toBe("wc_montonio_bnpl");
  });

  it("maps bank link to an enabled Montonio gateway when synthetic id is missing from Woo", () => {
    expect(
      resolveMontonioCheckoutGatewayId(MONTONIO_PAYMENT_METHOD_ID, [
        "ppcp-gateway",
        "wc_montonio_card",
      ]),
    ).toBe("wc_montonio_card");
  });

  it("passes through non-Montonio gateways", () => {
    expect(resolveMontonioCheckoutGatewayId("bacs")).toBe("bacs");
  });
});

describe("needsMontonioPaymentRemint", () => {
  it("requires remint for card-like Montonio options but not bank link", () => {
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
    expect(needsMontonioPaymentRemint(null)).toBe(false);
  });
});

describe("shouldRunMontonioPaymentRemint", () => {
  it("runs remint for card but uses Woo redirect for bank link", () => {
    const cardOption = {
      kind: "card",
      code: "card",
      systemName: "cardPayments",
    } as MontonioPaymentOption;
    const bankOption = {
      kind: "bank",
      code: "EEUHEE2X",
      systemName: "paymentInitiation",
    } as MontonioPaymentOption;

    expect(
      shouldRunMontonioPaymentRemint("wc_montonio_card", cardOption),
    ).toBe(true);
    expect(
      shouldRunMontonioPaymentRemint(MONTONIO_PAYMENT_METHOD_ID, bankOption),
    ).toBe(false);
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

  it("writes hire-purchase provider meta for hire gateway fallback", () => {
    const meta = buildMontonioCheckoutMetaData({
      paymentGatewayId: "wc_montonio_hire_purchase",
      locale: "en",
    });

    expect(meta).toEqual(
      expect.arrayContaining([
        { key: "checkout_locale", value: "en" },
        { key: "montonio_preferred_provider", value: "hirePurchase" },
      ]),
    );
  });

  it("infers Montonio option from synthetic gateway id", () => {
    expect(inferMontonioOptionFromGateway("wc_montonio_bnpl")).toEqual({
      code: "bnpl",
      name: "bnpl",
      logoUrl: null,
      systemName: "bnpl",
      kind: "bnpl",
    });
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
