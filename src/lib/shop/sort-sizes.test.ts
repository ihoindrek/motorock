import { describe, expect, it } from "vitest";
import { sortProductSizes } from "@/lib/shop/sort-sizes";

describe("sortProductSizes", () => {
  it("sorts standard letter sizes", () => {
    expect(sortProductSizes(["L", "S", "M", "XL"])).toEqual(["S", "M", "L", "XL"]);
  });

  it("sorts WooCommerce word-style size labels", () => {
    expect(
      sortProductSizes([
        "2X-Large",
        "4X-Large",
        "Medium",
        "Small",
        "X-Large",
        "Large",
        "5X-Large",
        "3X-Large",
      ]),
    ).toEqual([
      "Small",
      "Medium",
      "Large",
      "X-Large",
      "2X-Large",
      "3X-Large",
      "4X-Large",
      "5X-Large",
    ]);
  });
});
