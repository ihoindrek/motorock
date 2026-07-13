import { describe, expect, it } from "vitest";
import { resolveLegacyBrandSlugRedirect } from "@/lib/shop/brand-url";

describe("resolveLegacyBrandSlugRedirect", () => {
  it("maps old pando brand slug to pando-moto", () => {
    expect(resolveLegacyBrandSlugRedirect("/brandid/pando", "et")).toBe(
      "/brandid/pando-moto",
    );
    expect(resolveLegacyBrandSlugRedirect("/brand/pando", "en")).toBe(
      "/brand/pando-moto",
    );
    expect(resolveLegacyBrandSlugRedirect("/shop/brands/pando", "en")).toBe(
      "/brand/pando-moto",
    );
  });

  it("returns null for canonical brand slugs", () => {
    expect(resolveLegacyBrandSlugRedirect("/brandid/pando-moto", "et")).toBeNull();
  });
});
