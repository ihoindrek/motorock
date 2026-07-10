import { describe, expect, it } from "vitest";
import type { GraphQLProductCard } from "@/lib/graphql/types";
import { mergeCardPricingFields } from "@/lib/graphql/resolve-product-pricing";

describe("mergeCardPricingFields", () => {
  it("uses English pricing on localized WPML duplicates", () => {
    const et = {
      databaseId: 28299,
      price: "4,22&nbsp;€",
      regularPrice: "4,22&nbsp;€",
    };
    const en = {
      databaseId: 24710,
      price: "9,90&nbsp;€",
      regularPrice: "9,90&nbsp;€",
    };

    expect(
      mergeCardPricingFields(
        et as GraphQLProductCard,
        en as GraphQLProductCard,
      ),
    ).toEqual({
      databaseId: 28299,
      price: "9,90&nbsp;€",
      regularPrice: "9,90&nbsp;€",
    });
  });
});
