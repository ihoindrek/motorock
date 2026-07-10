import { describe, expect, it } from "vitest";
import {
  buildVariationIdsFromStoreProduct,
  findStoreVariationId,
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
