import { describe, expect, it } from "vitest";
import { parseCommerceAiRunRequestBody } from "@/lib/commerce-ai/validation/run-request";

describe("parseCommerceAiRunRequestBody", () => {
  it("accepts a valid product content writer request", () => {
    const parsed = parseCommerceAiRunRequestBody({
      skill: "product.content_writer",
      locale: "en",
      target: { productId: 123 },
      options: {
        dryRun: true,
        sections: ["description", "seo"],
      },
    });

    expect(parsed).toEqual({
      skill: "product.content_writer",
      locale: "en",
      target: { productId: 123 },
      options: {
        dryRun: true,
        sections: ["description", "seo"],
      },
    });
  });

  it("rejects invalid skill ids", () => {
    expect(
      parseCommerceAiRunRequestBody({
        skill: "product.unknown",
        locale: "en",
        target: { productId: 1 },
      }),
    ).toBeNull();
  });

  it("rejects empty section lists", () => {
    expect(
      parseCommerceAiRunRequestBody({
        skill: "product.content_writer",
        locale: "en",
        target: { productId: 1 },
        options: { sections: [] },
      }),
    ).toBeNull();
  });
});
