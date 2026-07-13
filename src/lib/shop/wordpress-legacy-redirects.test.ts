import { describe, expect, it } from "vitest";
import {
  inferLocaleFromLegacyPath,
  resolveWordPressLegacyRedirect,
} from "@/lib/shop/wordpress-legacy-redirects";

describe("resolveWordPressLegacyRedirect", () => {
  it("maps Woo product-category URLs to the new storefront routes", () => {
    expect(
      resolveWordPressLegacyRedirect("/product-category/motorcycles", "en"),
    ).toBe("/shop/motorcycles");
    expect(
      resolveWordPressLegacyRedirect("/product-category/mootorrattad", "et"),
    ).toBe("/shop/motorcycles");
    expect(
      resolveWordPressLegacyRedirect("/product-category/for-men/jackets-and-tags", "en"),
    ).toBe("/shop/equipment/for-men/jackets-and-tags");
    expect(
      resolveWordPressLegacyRedirect("/product-category/brixton-2", "en"),
    ).toBe("/shop/motorcycles?brand=brixton");
  });

  it("maps journal URLs to blog", () => {
    expect(resolveWordPressLegacyRedirect("/journal", "en")).toBe("/blog");
    expect(
      resolveWordPressLegacyRedirect("/journal/my-post-slug", "en"),
    ).toBe("/blog/my-post-slug");
  });

  it("maps shop landing pages to equipment hubs", () => {
    expect(resolveWordPressLegacyRedirect("/shop", "en")).toBe("/shop/equipment");
    expect(resolveWordPressLegacyRedirect("/pood", "et")).toBe("/tootekategooria");
  });
});

describe("inferLocaleFromLegacyPath", () => {
  it("detects Estonian legacy prefixes", () => {
    expect(inferLocaleFromLegacyPath("/toode/brixton-crossfire-125")).toBe("et");
    expect(inferLocaleFromLegacyPath("/tootekategooria/mootorrattad")).toBe("et");
  });

  it("detects English legacy prefixes", () => {
    expect(inferLocaleFromLegacyPath("/product/brixton-crossfire-125")).toBe("en");
    expect(inferLocaleFromLegacyPath("/product-category/motorcycles")).toBe("en");
  });
});
