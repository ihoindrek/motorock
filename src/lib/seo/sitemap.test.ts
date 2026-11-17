import { describe, expect, it } from "vitest";
import { buildLanguageAlternates } from "@/lib/seo/metadata";
import { isNonIndexablePath } from "@/lib/seo/non-indexable-paths";
import { buildStaticSitemapEntries, renderSitemapXml } from "@/lib/seo/sitemap";
import { PRODUCT_SLUG_PATH_TEMPLATES } from "@/lib/shop/product-url";

describe("sitemap", () => {
  it("does not list non-indexable utility routes", async () => {
    const entries = await buildStaticSitemapEntries();

    for (const entry of entries) {
      const path = new URL(entry.url).pathname;
      expect(isNonIndexablePath(path)).toBe(false);
    }
  });

  it("does not emit /product/item hreflang placeholders in XML", () => {
    const languages = buildLanguageAlternates(
      "/product/item",
      { en: "back-protector" },
      PRODUCT_SLUG_PATH_TEMPLATES,
    );
    const xml = renderSitemapXml([
      {
        url: languages.en as string,
        alternates: { languages },
      },
    ]);

    expect(xml).toContain("/en/product/back-protector");
    expect(xml).not.toContain("/product/item");
    expect(xml).not.toContain("/et/product/");
  });
});
