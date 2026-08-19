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
    ).toBe("/brand/brixton");
    expect(
      resolveWordPressLegacyRedirect("/product-category/brixton-2", "et"),
    ).toBe("/brandid/brixton");
  });

  it("maps journal URLs to blog", () => {
    expect(resolveWordPressLegacyRedirect("/journal", "en")).toBe("/blog");
    expect(
      resolveWordPressLegacyRedirect("/journal/my-post-slug", "en"),
    ).toBe("/blog/my-post-slug");
  });

  it("maps legacy WordPress root post URLs to /blog/{slug}", () => {
    expect(
      resolveWordPressLegacyRedirect("/moto-125-motorcycles-2026-guide", "en"),
    ).toBe("/blog/moto-125-motorcycles-2026-guide");
    expect(
      resolveWordPressLegacyRedirect(
        "/voida-brixton-crossfire-500-storr-motorocki-auhinnamang-2026",
        "et",
      ),
    ).toBe("/blog/voida-brixton-crossfire-500-storr-motorocki-auhinnamang-2026");
  });

  it("infers locale from legacy blog root slug language", () => {
    expect(inferLocaleFromLegacyPath("/moto-125-motorcycles-2026-guide")).toBe(
      "en",
    );
    expect(
      inferLocaleFromLegacyPath(
        "/voida-brixton-crossfire-500-storr-motorocki-auhinnamang-2026",
      ),
    ).toBe("et");
  });

  it("maps shop landing pages to equipment hubs", () => {
    expect(resolveWordPressLegacyRedirect("/shop", "en")).toBe("/shop/equipment");
    expect(resolveWordPressLegacyRedirect("/pood", "et")).toBe("/tootekategooria");
    expect(resolveWordPressLegacyRedirect("/pood/mootorrattad", "et")).toBe(
      "/shop/motorcycles",
    );
    expect(resolveWordPressLegacyRedirect("/ostukorv", "et")).toBe("/cart");
    expect(resolveWordPressLegacyRedirect("/kassa", "et")).toBe("/cart");
    expect(resolveWordPressLegacyRedirect("/checkout", "en")).toBe("/cart");
  });
  it("maps Estonian static page slugs to canonical routes", () => {
    expect(resolveWordPressLegacyRedirect("/kontakt", "et")).toBe("/contact");
    expect(resolveWordPressLegacyRedirect("/seadmed", "et")).toBe("/tootekategooria");
    expect(resolveWordPressLegacyRedirect("/meist", "et")).toBe("/about");
    expect(resolveWordPressLegacyRedirect("/privaatsus", "et")).toBe("/privacy");
    expect(
      resolveWordPressLegacyRedirect("/blogi/my-post", "et"),
    ).toBe("/blog/my-post");
  });
});

describe("inferLocaleFromLegacyPath", () => {
  it("detects Estonian legacy prefixes", () => {
    expect(inferLocaleFromLegacyPath("/toode/brixton-crossfire-125")).toBe("et");
    expect(inferLocaleFromLegacyPath("/tootekategooria/mootorrattad")).toBe("et");
    expect(inferLocaleFromLegacyPath("/kontakt")).toBe("et");
    expect(inferLocaleFromLegacyPath("/ostukorv")).toBe("et");
    expect(inferLocaleFromLegacyPath("/kassa")).toBe("et");
    expect(inferLocaleFromLegacyPath("/blogi/post-slug")).toBe("et");
  });

  it("detects English legacy prefixes", () => {
    expect(inferLocaleFromLegacyPath("/product/brixton-crossfire-125")).toBe("en");
    expect(inferLocaleFromLegacyPath("/product-category/motorcycles")).toBe("en");
  });
});
