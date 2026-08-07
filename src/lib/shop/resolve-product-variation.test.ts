import { describe, expect, it } from "vitest";
import {
  resolveActiveProductPrice,
  resolveActiveProductVariation,
} from "@/lib/shop/resolve-product-variation";

const kingsCanyonLike = {
  price: 243.97,
  sizes: ["SMALL", "4X-Large"],
  variationIds: {
    small: 18210,
    SMALL: 18210,
    "4x-large": 18204,
    "4X-Large": 18204,
  },
  variations: [
    { databaseId: 18210, sku: "s", color: "—", price: 243.97 },
    { databaseId: 18204, sku: "4xl", color: "—", price: 262.27 },
  ],
} as const;

describe("resolveActiveProductVariation", () => {
  it("matches the selected size variation", () => {
    expect(
      resolveActiveProductVariation(kingsCanyonLike, "4X-Large")?.databaseId,
    ).toBe(18204);
  });
});

describe("resolveActiveProductPrice", () => {
  it("returns the selected variation price", () => {
    expect(resolveActiveProductPrice(kingsCanyonLike, "SMALL")).toBe(243.97);
    expect(resolveActiveProductPrice(kingsCanyonLike, "4X-Large")).toBe(262.27);
  });

  it("falls back to the product price when no variation matches", () => {
    expect(resolveActiveProductPrice({ price: 99, sizes: ["M"] }, "M")).toBe(99);
  });
});
