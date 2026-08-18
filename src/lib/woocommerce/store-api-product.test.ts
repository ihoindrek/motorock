import { describe, expect, it } from "vitest";
import {
  buildAddToCartVariationAttributes,
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

describe("buildAddToCartVariationAttributes", () => {
  it("uses only size when the product has no color attribute", () => {
    const product = {
      id: 1,
      type: "variable",
      attributes: [{ name: "Size", terms: [{ name: "M", slug: "m" }] }],
      variations: [
        {
          id: 10,
          attributes: [
            { name: "Size", value: "m" },
            { name: "Finish", value: "black" },
          ],
        },
      ],
    };

    expect(
      buildAddToCartVariationAttributes(product, {}, 10),
    ).toEqual([{ attributeName: "pa_size", attributeValue: "m" }]);
  });

  it("maps leg length attributes to pa_leg-length", () => {
    const product = {
      id: 2,
      type: "variable",
      attributes: [
        { name: "size", terms: [{ name: "W32/L34", slug: "w32-l34" }] },
        {
          name: "Leg length",
          terms: [{ name: "L34", slug: "l34" }],
        },
      ],
      variations: [
        {
          id: 20,
          attributes: [
            { name: "size", value: "w32-l34" },
            { name: "Leg length", value: "l34" },
          ],
        },
      ],
    };

    expect(
      buildAddToCartVariationAttributes(product, {}, 20),
    ).toEqual([
      { attributeName: "pa_size", attributeValue: "w32-l34" },
      { attributeName: "pa_leg-length", attributeValue: "l34" },
    ]);
  });

  it("skips color when the product has no color attribute", () => {
    const product = {
      id: 3,
      type: "variable",
      attributes: [{ name: "Size", terms: [{ name: "L", slug: "l" }] }],
      variations: [],
    };

    expect(
      buildAddToCartVariationAttributes(product, { color: "black" }),
    ).toEqual([]);
  });
});

describe("buildVariationIdsFromStoreProduct", () => {
  it("maps color slugs and term names to variation ids", () => {
    expect(buildVariationIdsFromStoreProduct(kaelasoojendajad)).toEqual({
      must: 33818,
      Must: 33818,
      hall: 33819,
      Hall: 33819,
    });
  });

  it("ignores variations with null attribute values", () => {
    expect(
      buildVariationIdsFromStoreProduct({
        id: 1,
        type: "variable",
        attributes: [{ name: "size", terms: [{ name: "39", slug: "39" }] }],
        variations: [
          { id: 10, attributes: [{ name: "size", value: null }] },
          { id: 11, attributes: [{ name: "size", value: "39" }] },
        ],
      }),
    ).toEqual({
      "39": 11,
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
