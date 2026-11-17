import { describe, expect, it } from "vitest";
import { isNonIndexablePath } from "@/lib/seo/non-indexable-paths";

describe("non-indexable-paths", () => {
  it("flags utility storefront routes", () => {
    expect(isNonIndexablePath("/en/cart")).toBe(true);
    expect(isNonIndexablePath("/et/cart")).toBe(true);
    expect(isNonIndexablePath("/en/search")).toBe(true);
    expect(isNonIndexablePath("/en/wishlist")).toBe(true);
    expect(isNonIndexablePath("/en/checkout")).toBe(true);
    expect(isNonIndexablePath("/en/order/thank-you")).toBe(true);
    expect(isNonIndexablePath("/order/payment-return")).toBe(true);
    expect(isNonIndexablePath("/api/checkout/graphql")).toBe(true);
  });

  it("allows indexable catalog routes", () => {
    expect(isNonIndexablePath("/en/shop/equipment/for-men")).toBe(false);
    expect(isNonIndexablePath("/en/product/jacket")).toBe(false);
    expect(isNonIndexablePath("/en/blog/post-slug")).toBe(false);
  });
});
