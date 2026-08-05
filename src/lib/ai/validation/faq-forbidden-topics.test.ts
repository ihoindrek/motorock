import { describe, expect, it } from "vitest";
import {
  filterForbiddenFaqItems,
  isForbiddenFaqTopic,
} from "@/lib/ai/validation/faq-forbidden-topics";
import { ContentQualityValidator } from "@/lib/ai/validation/content-quality-validator";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";

const baseProduct = {
  productId: 1,
  locale: "en",
  slug: "test",
  name: "Test Glove",
  brand: "Bobhead",
  productType: "equipment",
  categoryPath: [],
  price: 50,
  currency: "EUR",
  inStock: true,
  attributes: [],
  variations: [],
  images: [],
  existing: {},
  translations: [],
  source: "unknown",
} satisfies NormalizedProduct;

describe("faq forbidden topics", () => {
  it("flags stock availability FAQ", () => {
    expect(
      isForbiddenFaqTopic(
        "Is this glove in stock?",
        "Yes, it is currently in stock and ships in 1–3 business days.",
      ),
    ).toBe(true);
  });

  it("flags showroom try-on FAQ", () => {
    expect(
      isForbiddenFaqTopic(
        "Can I try these gloves at the showroom?",
        "You are welcome to visit our Tallinn showroom.",
      ),
    ).toBe(true);
  });

  it("flags Estonian stock FAQ", () => {
    expect(
      isForbiddenFaqTopic(
        "Kas kindad on laos?",
        "Jah, toode on hetkel saadaval.",
      ),
    ).toBe(true);
  });

  it("allows sizing and materials FAQ", () => {
    expect(
      isForbiddenFaqTopic(
        "What sizes are available?",
        "This model is available in S, M, and L.",
      ),
    ).toBe(false);
  });

  it("filters forbidden items and keeps product FAQs", () => {
    const { kept, removed } = filterForbiddenFaqItems([
      {
        question: "Is it in stock?",
        answer: "Yes, currently available.",
      },
      {
        question: "What material is used?",
        answer: "These Bobhead gloves use leather construction.",
      },
      {
        question: "Does it include protection?",
        answer: "Yes, reinforced knuckle protection is included.",
      },
      {
        question: "Which sizes fit best?",
        answer: "Measure your hand circumference to choose S, M, or L.",
      },
    ]);

    expect(removed).toHaveLength(1);
    expect(kept).toHaveLength(3);
  });
});

const mockGenerationContext = {
  locale: "en" as const,
  jobId: "test",
  dryRun: true,
  promptVersion: "faq.v1",
  provider: { name: "openai", completeJson: async () => ({ data: {}, model: "test" }) },
  model: "gpt-test",
};

describe("ContentQualityValidator FAQ", () => {
  const validator = new ContentQualityValidator();

  it("rejects forbidden stock FAQ on sanitized output", () => {
    const report = validator.validateFaq(
      {
        items: [
          {
            question: "Is it in stock?",
            answer: "Yes, currently in stock at Motorock.",
          },
          {
            question: "What sizes are available?",
            answer: "Bobhead offers S, M, and L for this glove model.",
          },
          {
            question: "Is leather used?",
            answer: "Yes, Bobhead uses leather in this glove line.",
          },
        ],
      },
      baseProduct,
      mockGenerationContext,
    );

    expect(report.ok).toBe(false);
    expect(report.errors[0]).toContain("stock");
  });
});
