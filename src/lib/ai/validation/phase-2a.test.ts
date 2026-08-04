import { describe, expect, it } from "vitest";
import {
  FaqSectionSchema,
  AltTextSectionSchema,
  parseAiGenerateRequestBody,
} from "@/lib/ai/validation/schemas";
import {
  hasExistingAltTextContent,
  hasExistingFaqContent,
} from "@/lib/ai/domain/normalized-product";
import { parseAiProductFaqFromMeta } from "@/lib/seo/ai-product-faq";

describe("Phase 2A AI sections", () => {
  it("accepts valid FAQ output", () => {
    const result = FaqSectionSchema.safeParse({
      items: [
        {
          question: "Is this jacket waterproof?",
          answer: "The jacket uses a waterproof membrane suitable for all-season riding.",
        },
        {
          question: "What sizes are available?",
          answer: "This model is available in standard EU sizes from S to XL.",
        },
        {
          question: "Does it include armor?",
          answer: "Yes, CE Level 2 shoulder and elbow protectors are included.",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepts valid ALT text output", () => {
    const result = AltTextSectionSchema.safeParse({
      items: [{ imageIndex: 0, altText: "Black Rev'It motorcycle jacket front view" }],
    });

    expect(result.success).toBe(true);
  });

  it("parses generate request with faq and publishStatus", () => {
    const parsed = parseAiGenerateRequestBody({
      productId: 123,
      locale: "en",
      sections: ["seo", "faq"],
      options: { publishStatus: "draft", overwrite: "always" },
    });

    expect(parsed?.sections).toEqual(["seo", "faq"]);
    expect(parsed?.options?.publishStatus).toBe("draft");
  });

  it("detects existing FAQ content", () => {
    expect(
      hasExistingFaqContent({
        faq: [
          { question: "Is it waterproof?", answer: "Yes, it uses a waterproof membrane." },
          { question: "Which sizes?", answer: "Available from S to XL in EU sizing." },
          { question: "Includes armor?", answer: "CE Level 2 protectors are included." },
        ],
      }),
    ).toBe(true);
  });

  it("detects missing ALT text coverage", () => {
    expect(
      hasExistingAltTextContent({
        images: [{ url: "https://example.com/a.jpg", altText: "Short" }],
      }),
    ).toBe(false);
  });

  it("does not expose draft FAQ on storefront", () => {
    const faq = parseAiProductFaqFromMeta([
      { key: "_motorock_ai_content_status", value: "draft" },
      {
        key: "_motorock_ai_faq",
        value: JSON.stringify([
          {
            question: "Draft only?",
            answer: "This should not appear on the live storefront yet.",
          },
        ]),
      },
    ]);

    expect(faq).toBeUndefined();
  });

  it("repairs broken unicode escapes in stored FAQ text", () => {
    const faq = parseAiProductFaqFromMeta([
      {
        key: "_motorock_ai_faq",
        value: JSON.stringify([
          {
            question: "Mis luba on vaja?",
            answer: "Tu00e4pse info saamiseks vaata A1-kategooriat.",
          },
        ]),
      },
    ]);

    expect(faq?.[0]?.answer).toContain("Täpse");
  });
});
