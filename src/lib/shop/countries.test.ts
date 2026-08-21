import { describe, expect, it } from "vitest";
import {
  preferredCheckoutCountry,
  sortCountryCodes,
} from "@/lib/shop/countries";

describe("sortCountryCodes", () => {
  const sample = ["EE", "DE", "FI", "AT"] as const;

  it("sorts alphabetically when no country is preferred", () => {
    expect(sortCountryCodes(sample)).toEqual(["AT", "EE", "FI", "DE"]);
  });

  it("puts Estonia first for Estonian checkout locale only", () => {
    expect(
      sortCountryCodes(sample, preferredCheckoutCountry("et")),
    ).toEqual(["EE", "AT", "FI", "DE"]);
    expect(
      sortCountryCodes(sample, preferredCheckoutCountry("en")),
    ).toEqual(["AT", "EE", "FI", "DE"]);
  });
});
