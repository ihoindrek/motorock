import { describe, expect, it } from "vitest";
import { parseMontonioPaymentMethods } from "@/lib/montonio/payment-methods";

const objectPayload = {
  paymentMethods: {
    paymentInitiation: {
      setup: {
        EE: { paymentMethods: [{ code: "LHVBEE22", name: "LHV Estonia" }] },
        FI: { paymentMethods: [{ code: "NDEAFIHH", name: "Nordea" }] },
      },
    },
    cardPayments: { logoUrl: null },
    mobilePay: { logoUrl: null },
  },
};

describe("parseMontonioPaymentMethods", () => {
  it("includes MobilePay for Finnish customers", () => {
    const options = parseMontonioPaymentMethods(objectPayload, "FI");

    expect(options.map((option) => option.systemName)).toContain("mobilePay");
    const mobilePay = options.find((option) => option.systemName === "mobilePay");
    expect(mobilePay?.kind).toBe("mobilePay");
    expect(mobilePay?.name).toBe("MobilePay");
  });

  it("hides MobilePay for non-Finnish customers", () => {
    const options = parseMontonioPaymentMethods(objectPayload, "EE");

    expect(options.map((option) => option.systemName)).not.toContain("mobilePay");
    expect(options.map((option) => option.systemName)).toContain("cardPayments");
  });

  it("includes hire purchase for Estonian customers only", () => {
    const payload = {
      paymentMethods: [{ systemName: "hirePurchase" }, { systemName: "cardPayments" }],
    };

    expect(
      parseMontonioPaymentMethods(payload, "EE").map((option) => option.systemName),
    ).toEqual(["cardPayments", "hirePurchase"]);
    expect(
      parseMontonioPaymentMethods(payload, "LT").map((option) => option.systemName),
    ).toEqual(["cardPayments"]);
  });

  it("applies the same country gate to the array payload shape", () => {
    const arrayPayload = {
      paymentMethods: [
        { systemName: "cardPayments" },
        { systemName: "mobilePay" },
      ],
    };

    expect(
      parseMontonioPaymentMethods(arrayPayload, "FI").map((option) => option.systemName),
    ).toEqual(["cardPayments", "mobilePay"]);
    expect(
      parseMontonioPaymentMethods(arrayPayload, "EE").map((option) => option.systemName),
    ).toEqual(["cardPayments"]);
  });
});
