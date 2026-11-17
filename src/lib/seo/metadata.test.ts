import { describe, expect, it } from "vitest";
import {
  buildLanguageAlternates,
  resolveLocalizedPath,
} from "@/lib/seo/metadata";
import { PRODUCT_SLUG_PATH_TEMPLATES } from "@/lib/shop/product-url";

describe("buildLanguageAlternates", () => {
  it("omits locales without a product slug instead of using /product/item", () => {
    const languages = buildLanguageAlternates(
      "/product/item",
      { en: "back-protector" },
      PRODUCT_SLUG_PATH_TEMPLATES,
    );

    expect(languages.en).toContain("/en/product/back-protector");
    expect(languages.et).toBeUndefined();
    expect(languages["x-default"]).toBe(languages.en);
    expect(JSON.stringify(languages)).not.toContain("/product/item");
  });

  it("includes both locales when both slugs exist", () => {
    const languages = buildLanguageAlternates(
      "/product/item",
      { en: "back-protector", et: "seljakaitse" },
      PRODUCT_SLUG_PATH_TEMPLATES,
    );

    expect(languages.en).toContain("/en/product/back-protector");
    expect(languages.et).toContain("/et/toode/seljakaitse");
  });
});

describe("resolveLocalizedPath", () => {
  it("does not resolve missing ET slug to /et/product/item", () => {
    const path = resolveLocalizedPath(
      "et",
      "/product/item",
      { en: "back-protector" },
      PRODUCT_SLUG_PATH_TEMPLATES,
    );

    expect(path).toBe("/en/product/back-protector");
    expect(path).not.toContain("/product/item");
  });
});
