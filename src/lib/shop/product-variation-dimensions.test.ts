import { describe, expect, it } from "vitest";
import {
  areAttributeOptionsLikelyColors,
  buildVariationLookupKey,
  parseVariationSkuDimensions,
  shouldMapColorToPaSize,
} from "@/lib/shop/product-variation-dimensions";

describe("product-variation-dimensions", () => {
  it("detects mislabeled pa_size color options", () => {
    expect(areAttributeOptionsLikelyColors(["blk", "red", "yel"])).toBe(true);
    expect(areAttributeOptionsLikelyColors(["S", "M", "L"])).toBe(false);
  });

  it("parses Motogirl trouser SKUs", () => {
    expect(parseVariationSkuDimensions("FIO-TRO-BLK-6P")).toEqual({
      color: "blk",
      size: "6",
      legLength: "petite",
    });
  });

  it("builds composite variation lookup keys", () => {
    expect(
      buildVariationLookupKey({
        size: "6",
        color: "blk",
        legLength: "regular",
      }),
    ).toBe("6|blk|regular");
  });

  it("maps color to pa_size when UK size is separate", () => {
    expect(
      shouldMapColorToPaSize({
        size: "10",
        color: "blk",
      }),
    ).toBe(true);
    expect(
      shouldMapColorToPaSize({
        size: "M",
        color: "Black",
      }),
    ).toBe(false);
  });
});
