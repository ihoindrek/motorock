import { describe, expect, it } from "vitest";
import { parseBlogTarget } from "@/lib/commerce-ai/core/skill";
import { validateBlogArticleOutput } from "@/lib/commerce-ai/blog/validate-blog-output";

describe("parseBlogTarget", () => {
  it("accepts topic-only targets", () => {
    expect(parseBlogTarget({ topic: "Spring gear guide" })).toEqual({
      topic: "Spring gear guide",
    });
  });

  it("accepts productId with optional brief", () => {
    expect(parseBlogTarget({ productId: 42, brief: "Focus on commuting" })).toEqual({
      brief: "Focus on commuting",
      productId: 42,
    });
  });

  it("rejects empty targets", () => {
    expect(parseBlogTarget({})).toBeNull();
    expect(parseBlogTarget({ productId: 0 })).toBeNull();
  });
});

describe("validateBlogArticleOutput", () => {
  it("flags forbidden html and short content", () => {
    const report = validateBlogArticleOutput({
      title: "A practical spring riding gear guide for commuters",
      excerpt: "How to choose lightweight layers and waterproof gear for changeable spring weather on your daily ride.",
      contentHtml: "<script>alert(1)</script><p>Short</p>",
      slugSuggestion: "spring-riding-gear-guide",
      categorySlugs: ["guides"],
    });

    expect(report.ok).toBe(false);
    expect(report.errors.length).toBeGreaterThan(0);
  });
});
