import { describe, expect, it } from "vitest";
import {
  cartSizeToWooSizeSlug,
  euUkSizesMatch,
  formatEuUkSizeLabel,
  parseEuUkSize,
} from "@/lib/shop/eu-uk-size";

describe("eu-uk-size", () => {
  it("formats UK numeric to EU label", () => {
    expect(formatEuUkSizeLabel(10)).toBe("EU38 (UK10)");
  });

  it("parses compound labels and slugs", () => {
    expect(parseEuUkSize("EU38 (UK10)")).toEqual({
      eu: 38,
      uk: 10,
      label: "EU38 (UK10)",
    });
    expect(parseEuUkSize("eu38-uk10")).toEqual({
      eu: 38,
      uk: 10,
      label: "EU38 (UK10)",
    });
  });

  it("matches legacy UK cart size to normalized Woo slug", () => {
    expect(euUkSizesMatch("10", "eu38-uk10")).toBe(true);
    expect(euUkSizesMatch("EU38 (UK10)", "10")).toBe(true);
  });

  it("builds Woo size slug from cart label", () => {
    expect(cartSizeToWooSizeSlug("10")).toBe("eu38-uk10");
    expect(cartSizeToWooSizeSlug("EU38 (UK10)")).toBe("eu38-uk10");
  });
});
