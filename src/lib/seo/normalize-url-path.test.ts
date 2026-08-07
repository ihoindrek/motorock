import { describe, expect, it } from "vitest";
import { hasTrailingSlash, normalizeUrlPath } from "@/lib/seo/normalize-url-path";

describe("normalizeUrlPath", () => {
  it("removes trailing slashes", () => {
    expect(normalizeUrlPath("/en/product/brixton-crossfire-500-storr/")).toBe(
      "/en/product/brixton-crossfire-500-storr",
    );
    expect(normalizeUrlPath("/product-category/motorcycles/brixton-2/")).toBe(
      "/product-category/motorcycles/brixton-2",
    );
  });

  it("keeps the root path", () => {
    expect(normalizeUrlPath("/")).toBe("/");
  });
});

describe("hasTrailingSlash", () => {
  it("detects non-root trailing slashes", () => {
    expect(hasTrailingSlash("/en/shop/motorcycles/")).toBe(true);
    expect(hasTrailingSlash("/")).toBe(false);
    expect(hasTrailingSlash("/en")).toBe(false);
  });
});
