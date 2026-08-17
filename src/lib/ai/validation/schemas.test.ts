import { describe, expect, it } from "vitest";
import {
  DescriptionSectionSchema,
  parseAiBatchRequestBody,
  parseAiGenerateRequestBody,
  SeoSectionSchema,
} from "@/lib/ai/validation/schemas";
import { hasExistingDescriptionContent } from "@/lib/ai/domain/normalized-product";
import { findForbiddenHtmlTags } from "@/lib/ai/validation/html-safety";

describe("AI validation schemas", () => {
  it("accepts valid description output", () => {
    const result = DescriptionSectionSchema.safeParse({
      shortDescription: "<p>Rev'It! GT-R jacket for all-season riding with CE armor.</p>",
      description:
        "<h2>Overview</h2><p>Detailed copy about materials and fit.</p>".repeat(8),
    });

    expect(result.success).toBe(true);
  });

  it("rejects SEO title that is too long", () => {
    const result = SeoSectionSchema.safeParse({
      title: "A".repeat(59),
      metaDescription: "M".repeat(90),
      keywords: ["jacket", "revit", "motorcycle"],
    });

    expect(result.success).toBe(false);
  });

  it("parses generate request body", () => {
    const parsed = parseAiGenerateRequestBody({
      productId: 123,
      locale: "en",
      sections: ["description", "seo"],
      options: { dryRun: true },
    });

    expect(parsed).toEqual({
      productId: 123,
      locale: "en",
      sections: ["description", "seo"],
      options: { dryRun: true },
    });
  });

  it("parses batch request body", () => {
    const parsed = parseAiBatchRequestBody({
      productIds: [25800, 25801],
      locales: ["en", "et"],
      sections: ["description"],
      options: { dryRun: false, overwrite: "always" },
    });

    expect(parsed).toEqual({
      productIds: [25800, 25801],
      locales: ["en", "et"],
      sections: ["description"],
      options: { dryRun: false, overwrite: "always" },
    });
  });

  it("parses batch request with empty provider option", () => {
    const parsed = parseAiBatchRequestBody({
      productIds: [25800],
      locales: ["en"],
      sections: ["description"],
      options: { dryRun: false, overwrite: "always", provider: "" },
    });

    expect(parsed).toEqual({
      productIds: [25800],
      locales: ["en"],
      sections: ["description"],
      options: { dryRun: false, overwrite: "always" },
    });
  });

  it("rejects batch requests above job limit", () => {
    const parsed = parseAiBatchRequestBody({
      productIds: Array.from({ length: 20 }, (_, index) => index + 1),
      locales: ["en", "et"],
      sections: ["description"],
    });

    expect(parsed).toBeNull();
  });
});

describe("AI domain helpers", () => {
  it("detects existing description content", () => {
    expect(
      hasExistingDescriptionContent({
        shortDescription: "<p>" + "Short copy ".repeat(5) + "</p>",
        description: "<p>" + "Long copy ".repeat(40) + "</p>",
      }),
    ).toBe(true);
  });

  it("treats WPML-copied English copy as empty for Estonian locale", () => {
    expect(
      hasExistingDescriptionContent(
        {
          shortDescription:
            "<p>The Holyfreedom Definitive Jacket in Orange brings vintage style to everyday riding.</p>",
          description: "<p>" + "Detailed English riding jacket copy. ".repeat(20) + "</p>",
        },
        "et",
      ),
    ).toBe(false);
  });

  it("detects Estonian description as existing for et locale", () => {
    expect(
      hasExistingDescriptionContent(
        {
          shortDescription:
            "<p>Holyfreedom Definitive Jacket Orange on vintage-stiilis mootorrattajope igapäevaseks sõiduks.</p>",
          description: "<p>" + "Eestikeelne pikk tootekirjeldus ja detailid. ".repeat(20) + "</p>",
        },
        "et",
      ),
    ).toBe(true);
  });

  it("flags forbidden HTML tags", () => {
    expect(findForbiddenHtmlTags('<p>ok</p><script>alert(1)</script>')).toContain("script");
  });
});
