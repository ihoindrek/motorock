import { describe, expect, it } from "vitest";
import {
  hasCatalogFilterQuery,
  isCatalogFilterablePath,
  shouldNoindexCatalogFilterUrl,
} from "@/lib/seo/catalog-filter-url";

describe("catalog-filter-url", () => {
  it("detects catalog paths", () => {
    expect(isCatalogFilterablePath("/en/shop/equipment/for-men")).toBe(true);
    expect(isCatalogFilterablePath("/et/tootekategooria/meestele")).toBe(true);
    expect(isCatalogFilterablePath("/en/brand/brixton")).toBe(true);
    expect(isCatalogFilterablePath("/en/shop/motorcycles")).toBe(true);
    expect(isCatalogFilterablePath("/en/blog")).toBe(false);
  });

  it("detects filter query params", () => {
    expect(hasCatalogFilterQuery("?brand=pando-moto")).toBe(true);
    expect(hasCatalogFilterQuery("?utm_source=google")).toBe(false);
    expect(hasCatalogFilterQuery("")).toBe(false);
  });

  it("noindexes filtered catalog views only", () => {
    expect(
      shouldNoindexCatalogFilterUrl(
        "/en/shop/equipment/for-men",
        "?brand=pando-moto",
      ),
    ).toBe(true);
    expect(
      shouldNoindexCatalogFilterUrl("/en/shop/equipment/for-men", ""),
    ).toBe(false);
    expect(
      shouldNoindexCatalogFilterUrl("/en/blog", "?brand=pando-moto"),
    ).toBe(false);
  });
});
