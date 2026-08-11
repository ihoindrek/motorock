import { describe, expect, it } from "vitest";
import {
  buildVariationIdsFromStoreProduct,
  cartSizeToWooAttributeSlug,
  findStoreVariationId,
  resolveSizeAttributeSlug,
} from "@/lib/woocommerce/store-api-product";

const kaelasoojendajad = {
  id: 33817,
  type: "variable",
  attributes: [
    {
      name: "Värv",
      terms: [
        { name: "Must", slug: "must" },
        { name: "Hall", slug: "hall" },
      ],
    },
  ],
  variations: [
    { id: 33818, attributes: [{ name: "Värv", value: "must" }] },
    { id: 33819, attributes: [{ name: "Värv", value: "hall" }] },
  ],
};

describe("buildVariationIdsFromStoreProduct", () => {
  it("maps color slugs and term names to variation ids", () => {
    expect(buildVariationIdsFromStoreProduct(kaelasoojendajad)).toEqual({
      must: 33818,
      Must: 33818,
      hall: 33819,
      Hall: 33819,
    });
  });
});

describe("findStoreVariationId", () => {
  it("finds a color-only variation", () => {
    expect(
      findStoreVariationId(kaelasoojendajad, { color: "must" }),
    ).toBe(33818);
  });

  it("returns the only variation without explicit selection", () => {
    expect(
      findStoreVariationId(
        {
          id: 1,
          type: "variable",
          variations: [{ id: 55, attributes: [] }],
        },
        {},
      ),
    ).toBe(55);
  });
});

describe("resolveSizeAttributeSlug", () => {
  const jeans = {
    id: 37678,
    type: "variable",
    attributes: [
      {
        name: "size",
        terms: [
          { name: "W32/L34", slug: "w32-l34" },
          { name: "W30/L30", slug: "w30-l30" },
        ],
      },
    ],
    variations: [],
  };

  it("maps display size labels to Woo pa_size slugs", () => {
    expect(resolveSizeAttributeSlug("W32/L34", jeans)).toBe("w32-l34");
    expect(resolveSizeAttributeSlug("w32-l34", jeans)).toBe("w32-l34");
  });
});

describe("cartSizeToWooAttributeSlug", () => {
  it("maps letter and compound sizes for browser checkout", () => {
    expect(cartSizeToWooAttributeSlug("L")).toBe("l");
    expect(cartSizeToWooAttributeSlug("2XL")).toBe("2xl");
    expect(cartSizeToWooAttributeSlug("W32/L34")).toBe("w32-l34");
  });
});
