import { describe, expect, it } from "vitest";
import {
  parseGraphqlPrice,
  roundRetailPrice,
} from "@/lib/shop/parse-graphql-price";

describe("roundRetailPrice", () => {
  it("rounds to the nearest 5 cents", () => {
    expect(roundRetailPrice(243.97)).toBe(243.95);
    expect(roundRetailPrice(262.27)).toBe(262.25);
    expect(roundRetailPrice(115.87)).toBe(115.85);
    expect(roundRetailPrice(99.99)).toBe(100);
  });
});

describe("parseGraphqlPrice", () => {
  it("parses WooGraphQL money strings and rounds for retail display", () => {
    expect(parseGraphqlPrice("243,97&nbsp;€")).toBe(243.95);
    expect(parseGraphqlPrice("262,27&nbsp;€")).toBe(262.25);
  });
});
