import { describe, expect, it } from "vitest";
import { isMontonioPaymentCountry } from "@/lib/montonio/payment-countries";

describe("isMontonioPaymentCountry", () => {
  it("allows Baltic, Poland, and Finland", () => {
    for (const country of ["EE", "LV", "LT", "PL", "FI"]) {
      expect(isMontonioPaymentCountry(country)).toBe(true);
      expect(isMontonioPaymentCountry(country.toLowerCase())).toBe(true);
    }
  });

  it("blocks other countries", () => {
    expect(isMontonioPaymentCountry("DE")).toBe(false);
    expect(isMontonioPaymentCountry("SE")).toBe(false);
    expect(isMontonioPaymentCountry(null)).toBe(false);
  });
});
