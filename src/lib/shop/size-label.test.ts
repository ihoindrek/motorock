import { describe, expect, it } from "vitest";
import {
  extractEmbeddedProductSize,
  formatSizeButtonParts,
  formatSizeLabel,
  isCompoundSizeLabel,
  resolveSizeOptionLabel,
  sizesMatch,
  stripSizeLocaleSuffix,
} from "@/lib/shop/size-label";

describe("stripSizeLocaleSuffix", () => {
  it("removes WPML et/en suffixes", () => {
    expect(stripSizeLocaleSuffix("s-et")).toBe("s");
    expect(stripSizeLocaleSuffix("m-et")).toBe("m");
    expect(stripSizeLocaleSuffix("xl-en")).toBe("xl");
  });

  it("leaves jeans codes intact", () => {
    expect(stripSizeLocaleSuffix("w30-l34")).toBe("w30-l34");
  });
});

describe("formatSizeLabel", () => {
  it("normalizes locale-suffixed sizes for display", () => {
    expect(formatSizeLabel("s-et")).toBe("S");
    expect(formatSizeLabel("2xl-et")).toBe("2XL");
  });
});

describe("extractEmbeddedProductSize", () => {
  it("reads size from Woo product title", () => {
    expect(
      extractEmbeddedProductSize({
        name: "TERMINATOR HIGH CE WATERPROOF BOOTS (shoes size: 43)",
      }),
    ).toBe("43");
    expect(
      extractEmbeddedProductSize({
        name: "VEEKINDLAD TERMINATOR HIGH CE SAAPAD (kinganumber: 43)",
      }),
    ).toBe("43");
    expect(
      extractEmbeddedProductSize({
        name: "TERMINATOR 2 PRUUN (kingasuurus: 39)",
      }),
    ).toBe("39");
  });

  it("reads size from product slug when title has no marker", () => {
    expect(
      extractEmbeddedProductSize({
        slug: "terminator-high-ce-waterproof-boots-shoes-size-43",
      }),
    ).toBe("43");
    expect(
      extractEmbeddedProductSize({
        slug: "terminator-2-pruun-kingasuurus-39",
      }),
    ).toBe("39");
  });
});

describe("resolveSizeOptionLabel", () => {
  const terms = [
    { name: "S", slug: "s" },
    { name: "M", slug: "m" },
    { name: "W30/L34", slug: "w30-l34" },
  ];

  it("prefers taxonomy term names for WPML option slugs", () => {
    expect(resolveSizeOptionLabel("s-et", terms)).toBe("S");
    expect(resolveSizeOptionLabel("m-et", terms)).toBe("M");
  });

  it("maps jeans option slugs to term names", () => {
    expect(resolveSizeOptionLabel("w30-l34", terms)).toBe("W30/L34");
  });

  it("falls back to formatSizeLabel without terms", () => {
    expect(resolveSizeOptionLabel("s-et")).toBe("S");
  });

  it("ignores null or blank WooCommerce option values", () => {
    expect(resolveSizeOptionLabel(null)).toBe("");
    expect(resolveSizeOptionLabel(undefined)).toBe("");
    expect(resolveSizeOptionLabel("   ")).toBe("");
  });
});

describe("sizesMatch", () => {
  it("matches locale-suffixed slugs to display labels", () => {
    expect(sizesMatch("s-et", "S")).toBe(true);
    expect(sizesMatch("m-et", "M")).toBe(true);
  });

  it("matches compound UK/EU/US labels to Woo slugs", () => {
    expect(sizesMatch("uk26-eu54-us24", "UK26/EU54/US24")).toBe(true);
    expect(sizesMatch("UK10/EU38/US8", "uk10-eu38-us8")).toBe(true);
  });
});

describe("formatSizeButtonParts", () => {
  it("splits multi-region labels for stacked buttons", () => {
    expect(formatSizeButtonParts("UK10/EU38/US8")).toEqual([
      "UK10",
      "EU38",
      "US8",
    ]);
  });

  it("returns a single part for simple labels", () => {
    expect(formatSizeButtonParts("M")).toEqual(["M"]);
  });
});

describe("isCompoundSizeLabel", () => {
  it("detects slash-separated labels", () => {
    expect(isCompoundSizeLabel("UK10/EU38/US8")).toBe(true);
    expect(isCompoundSizeLabel("M")).toBe(false);
  });
});
