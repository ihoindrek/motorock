import { describe, expect, it } from "vitest";
import { parseAiProductSeoFromMeta } from "@/lib/seo/ai-product-seo";
import { buildProductSeoSnapshotFromCatalog } from "@/lib/seo/product-metadata";
import type { CatalogProduct } from "@/types/catalog-product";

describe("AI product SEO on storefront", () => {
  it("parses AI meta from GraphQL metaData", () => {
    const parsed = parseAiProductSeoFromMeta([
      { key: "_motorock_ai_seo_title", value: "Custom SEO title" },
      {
        key: "_motorock_ai_seo_meta_description",
        value: "Custom meta description with enough length for search results.",
      },
      { key: "_motorock_ai_seo_keywords", value: '["jacket","revit"]' },
    ]);

    expect(parsed?.title).toBe("Custom SEO title");
    expect(parsed?.keywords).toEqual(["jacket", "revit"]);
  });

  it("prefers AI SEO meta over rule-based fallback", () => {
    const product = {
      slug: "test",
      name: "Test Jacket",
      brand: "Rev'It",
      price: 199,
      image: "/test.jpg",
      lifestyleImage: "/test.jpg",
      type: "equipment",
      gender: "men",
      category: "jackets",
      sizes: ["M"],
      colors: ["Black"],
      inStock: true,
      isNew: false,
      tagline: "Short",
      description: "Long",
      specs: [],
      features: [],
      backHref: "/shop/equipment",
      backLabel: "Equipment",
      aiSeo: {
        title: "AI title for jacket",
        metaDescription:
          "AI meta description with enough characters to pass validation easily.",
      },
    } satisfies CatalogProduct;

    const snapshot = buildProductSeoSnapshotFromCatalog(product, "en");
    expect(snapshot.seoTitle).toBe("AI title for jacket");
    expect(snapshot.seoDescription).toContain("AI meta description");
  });
});
