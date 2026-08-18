import { describe, expect, it } from "vitest";
import { flattenShippingRates } from "@/lib/graphql/checkout";

describe("flattenShippingRates", () => {
  it("returns empty array when Woo returns null packages", () => {
    expect(flattenShippingRates(null)).toEqual([]);
  });

  it("flattens rates from shipping packages", () => {
    expect(
      flattenShippingRates([
        {
          packageDetails: null,
          rates: [{ id: "flat_rate:1", label: "Standard", cost: "5" }],
        },
      ]),
    ).toEqual([{ id: "flat_rate:1", label: "Standard", cost: "5" }]);
  });
});
