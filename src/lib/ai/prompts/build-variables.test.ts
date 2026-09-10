import { describe, expect, it } from "vitest";
import { buildProductPromptVariables } from "@/lib/ai/prompts/build-variables";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";

const baseProduct: NormalizedProduct = {
  productId: 1,
  locale: "en",
  slug: "test-jacket",
  name: "Test Jacket",
  brand: "Rukka",
  productType: "equipment",
  categoryPath: ["For men", "Jackets"],
  price: 199,
  currency: "EUR",
  inStock: true,
  attributes: [{ name: "Size", slug: "pa_size", values: ["M", "L"], isVariation: true }],
  variations: [
    { attributes: { Size: "M" }, inStock: true, price: 199 },
    { attributes: { Size: "L" }, inStock: false, price: 199 },
  ],
  images: [{ url: "https://example.com/a.jpg", altText: "Test Jacket front" }],
  existing: {
    shortDescription: "<p>Short</p>",
    description: "<p>Long supplier description about materials and fit.</p>",
  },
  translations: [],
  source: "unknown",
};

describe("buildProductPromptVariables", () => {
  it("includes variations and existing description excerpt", () => {
    const vars = buildProductPromptVariables(baseProduct);

    expect(vars.variationsJson).toContain("Size");
    expect(vars.existingDescriptionExcerpt).toContain("supplier description");
    expect(vars.sku).toBe("");
  });
});
