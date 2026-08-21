import { describe, expect, it } from "vitest";
import { isLocaleBypassPath } from "@/proxy";

describe("isLocaleBypassPath", () => {
  it("allows Montonio payment return without locale prefix", () => {
    expect(isLocaleBypassPath("/order/payment-return")).toBe(true);
    expect(isLocaleBypassPath("/order/payment-return/extra")).toBe(true);
  });

  it("does not bypass normal storefront routes", () => {
    expect(isLocaleBypassPath("/cart")).toBe(false);
    expect(isLocaleBypassPath("/en/cart")).toBe(false);
    expect(isLocaleBypassPath("/.well-known/apple-developer-merchantid-domain-association")).toBe(
      false,
    );
  });
});
