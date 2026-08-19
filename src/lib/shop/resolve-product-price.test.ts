import { describe, expect, it } from "vitest";
import {
  isProductOnSale,
  resolveGraphqlProductPrice,
  resolveProductDiscountPercent,
} from "@/lib/shop/resolve-product-price";

describe("resolveGraphqlProductPrice", () => {
  it("returns sale and regular price when product is on sale", () => {
    expect(
      resolveGraphqlProductPrice({
        regularPrice: "5000,00&nbsp;€",
        price: "4500,00&nbsp;€",
      }),
    ).toEqual({
      price: 4500,
      regularPrice: 5000,
    });
  });

  it("returns regular price when no sale is active", () => {
    expect(
      resolveGraphqlProductPrice({
        regularPrice: "5000,00&nbsp;€",
        price: "5000,00&nbsp;€",
      }),
    ).toEqual({
      price: 5000,
    });
  });

  it("falls back to price when regular price is missing", () => {
    expect(
      resolveGraphqlProductPrice({
        price: "3195,00&nbsp;€",
      }),
    ).toEqual({
      price: 3195,
    });
  });
});

describe("isProductOnSale", () => {
  it("detects active sale pricing", () => {
    expect(
      isProductOnSale({
        price: 4500,
        regularPrice: 5000,
      }),
    ).toBe(true);
  });
});

describe("resolveProductDiscountPercent", () => {
  it("returns rounded discount percent", () => {
    expect(resolveProductDiscountPercent(4500, 5000)).toBe(10);
  });

  it("returns null when not on sale", () => {
    expect(resolveProductDiscountPercent(5000, 5000)).toBeNull();
  });
});
