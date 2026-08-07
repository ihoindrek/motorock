import { describe, expect, it } from "vitest";
import { en } from "@/i18n/dictionaries/en";
import { resolvePaymentTrustBadges } from "@/lib/shop/payment-trust-badges";

describe("resolvePaymentTrustBadges", () => {
  it("includes hire purchase and BNPL for Estonia", () => {
    const badges = resolvePaymentTrustBadges("EE", en);
    expect(badges.map((badge) => badge.id)).toEqual([
      "bank",
      "card",
      "paypal",
      "hire-purchase",
      "bnpl",
    ]);
  });

  it("includes MobilePay for Finland", () => {
    const badges = resolvePaymentTrustBadges("FI", en);
    expect(badges.map((badge) => badge.id)).toContain("mobilepay");
    expect(badges.map((badge) => badge.id)).not.toContain("hire-purchase");
  });

  it("defaults to Estonia when country is missing", () => {
    const badges = resolvePaymentTrustBadges(null, en);
    expect(badges.some((badge) => badge.id === "hire-purchase")).toBe(true);
  });
});
