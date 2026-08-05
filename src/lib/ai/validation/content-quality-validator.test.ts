import { describe, expect, it } from "vitest";
import { ContentQualityValidator } from "@/lib/ai/validation/content-quality-validator";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";
import type { GenerationContext } from "@/lib/ai/core/types";

function product(
  overrides: Partial<NormalizedProduct> = {},
): NormalizedProduct {
  return {
    productId: 1,
    locale: "en",
    slug: "test-jacket",
    name: "Test Jacket",
    brand: "Pando Moto",
    productType: "equipment",
    category: "jackets",
    categoryPath: ["jackets"],
    price: 100,
    currency: "EUR",
    inStock: true,
    attributes: [],
    variations: [],
    images: [
      { url: "https://example.com/1.jpg" },
      { url: "https://example.com/2.jpg" },
    ],
    existing: {},
    translations: [],
    source: "unknown",
    ...overrides,
  };
}

function context(locale: "en" | "et"): GenerationContext {
  return {
    locale,
    jobId: "job-1",
    dryRun: true,
    promptVersion: "alt_text.v1",
    provider: { name: "anthropic", completeJson: async () => ({ data: {}, model: "test" }) },
    model: "test",
  };
}

describe("ContentQualityValidator.validateAltText", () => {
  const validator = new ContentQualityValidator();

  it("accepts Estonian alt text without special characters", () => {
    const result = validator.validateAltText(
      {
        items: [
          {
            imageIndex: 0,
            altText: "Pando Moto Twin nahast motojope, must, eestvaade",
          },
          {
            imageIndex: 1,
            altText: "Pando Moto Twin nahast motojope, tagantvaade detail",
          },
        ],
      },
      product({ locale: "et" }),
      context("et"),
    );

    expect(result.ok).toBe(true);
  });

  it("fails when an image index is missing", () => {
    const result = validator.validateAltText(
      {
        items: [
          {
            imageIndex: 0,
            altText: "Pando Moto Twin leather jacket black front view",
          },
        ],
      },
      product(),
      context("en"),
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Missing ALT text for imageIndex 1");
  });

  it("fails when imageIndex is out of range", () => {
    const result = validator.validateAltText(
      {
        items: [
          {
            imageIndex: 2,
            altText: "Pando Moto Twin leather jacket black front view",
          },
        ],
      },
      product(),
      context("en"),
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("ALT imageIndex 2 is out of range");
  });
});
