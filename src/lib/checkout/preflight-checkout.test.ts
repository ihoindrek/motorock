import { describe, expect, it } from "vitest";
import { validateCheckoutPreflight } from "@/lib/checkout/preflight-checkout";
import { MONTONIO_PAYMENT_METHOD_ID } from "@/lib/graphql/checkout";

describe("validateCheckoutPreflight", () => {
  const baseInput = {
    selectedPaymentMethodId: "ppcp-gateway",
    selectedShippingRateId: "flat_rate:1",
    wooPaymentGatewayIds: ["ppcp-gateway", MONTONIO_PAYMENT_METHOD_ID],
    cartItemCount: 1,
    availableShippingRateIds: ["flat_rate:1"],
    chosenShippingMethods: ["flat_rate:1"],
    locale: "et" as const,
  };

  it("passes when cart, shipping, and payment are valid", () => {
    const result = validateCheckoutPreflight(baseInput);

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.resolvedPaymentMethodId).toBe("ppcp-gateway");
  });

  it("blocks empty cart", () => {
    const result = validateCheckoutPreflight({
      ...baseInput,
      cartItemCount: 0,
    });

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("Ostukorv");
  });

  it("passes when Woo omits available rates but chosen shipping matches", () => {
    const result = validateCheckoutPreflight({
      ...baseInput,
      availableShippingRateIds: [],
      chosenShippingMethods: ["flat_rate:1"],
    });

    expect(result.ok).toBe(true);
  });

  it("blocks shipping rate missing from Woo session", () => {
    const result = validateCheckoutPreflight({
      ...baseInput,
      availableShippingRateIds: [],
      chosenShippingMethods: ["flat_rate:2"],
    });

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("pole enam saadaval"))).toBe(
      true,
    );
  });

  it("blocks bank link when Woo only exposes card Montonio gateway", () => {
    const result = validateCheckoutPreflight({
      ...baseInput,
      selectedPaymentMethodId: MONTONIO_PAYMENT_METHOD_ID,
      wooPaymentGatewayIds: ["ppcp-gateway", "wc_montonio_card"],
      montonioOption: {
        kind: "bank",
        code: "LHVBEE22",
        name: "LHV",
        logoUrl: null,
        systemName: "paymentInitiation",
      },
    });

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("Pangalink"))).toBe(true);
  });

  it("tolerates missing chosenShippingMethods from Woo cart", () => {
    const result = validateCheckoutPreflight({
      ...baseInput,
      chosenShippingMethods: undefined,
    });

    expect(result.ok).toBe(true);
  });

  it("resolves synthetic Montonio card gateway to enabled Woo gateway", () => {
    const result = validateCheckoutPreflight({
      ...baseInput,
      selectedPaymentMethodId: "wc_montonio_card",
      wooPaymentGatewayIds: ["ppcp-gateway", MONTONIO_PAYMENT_METHOD_ID],
      montonioOption: {
        kind: "card",
        code: "card",
        name: "Card",
        logoUrl: null,
        systemName: "cardPayments",
      },
    });

    expect(result.ok).toBe(true);
    expect(result.resolvedPaymentMethodId).toBe(MONTONIO_PAYMENT_METHOD_ID);
  });
});
