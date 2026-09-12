import { describe, expect, it } from "vitest";
import { resolveLineVariationId } from "@/lib/shop/resolve-cart-variation";

describe("resolveLineVariationId", () => {
  const product = {
    sizes: ["S", "M", "L"],
    variationIds: {
      S: 101,
      M: 102,
      L: 103,
      must: 201,
      hall: 202,
    },
  };

  it("resolves by size", () => {
    expect(resolveLineVariationId(product, "M")).toBe(102);
  });

  it("resolves by color when size is one-size", () => {
    expect(
      resolveLineVariationId(
        { sizes: ["One size"], variationIds: product.variationIds },
        "One size",
        "must",
      ),
    ).toBe(201);
  });

  it("returns the only variation when there is just one", () => {
    expect(
      resolveLineVariationId(
        { sizes: [], variationIds: { Default: 999 } },
        undefined,
        undefined,
      ),
    ).toBe(999);
  });

  it("resolves size labels that differ in formatting", () => {
    expect(
      resolveLineVariationId(
        {
          sizes: ["4X-Large"],
          variationIds: { "4x-large": 18204, "4X-Large": 18204 },
        },
        "4X-Large",
      ),
    ).toBe(18204);
  });

  it("returns undefined when multiple options exist without a match", () => {
    expect(resolveLineVariationId(product, undefined, undefined)).toBeUndefined();
  });

  it("resolves Motogirl trousers by size and leg length without color in cart", () => {
    const trousers = {
      sizes: ["EU34 (UK6)"],
      legLengths: ["Petite", "Regular", "Tall"],
      variationIds: {
        "EU34 (UK6)|black|regular": 23100,
        "EU34 (UK6)||regular": 23100,
        "EU34 (UK6)|black|petite": 23101,
        "EU34 (UK6)||petite": 23101,
        "EU34 (UK6)": 23099,
      },
    };

    expect(
      resolveLineVariationId(trousers, "EU34 (UK6)", undefined, "Regular"),
    ).toBe(23100);
    expect(
      resolveLineVariationId(trousers, "EU34 (UK6)", undefined, "Petite"),
    ).toBe(23101);
  });

  it("does not fall back to size-only lookup when leg length is required", () => {
    const trousers = {
      sizes: ["EU34 (UK6)"],
      legLengths: ["Petite", "Regular", "Tall"],
      variationIds: {
        "EU34 (UK6)": 23099,
      },
    };

    expect(
      resolveLineVariationId(trousers, "EU34 (UK6)", undefined, "Regular"),
    ).toBeUndefined();
  });
});
