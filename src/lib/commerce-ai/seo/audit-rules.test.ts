import { describe, expect, it } from "vitest";
import { auditPost, auditProduct, findDuplicateGroups } from "@/lib/commerce-ai/seo/audit-rules";
import type { GraphQLProduct } from "@/lib/graphql/types";
import type { GraphQLBlogPostCard } from "@/lib/graphql/types-blog";

const weakProduct = {
  databaseId: 10,
  name: "Test Jacket",
  slug: "test-jacket",
  shortDescription: "<p>Short</p>",
  description: "<p>Too short</p>",
  languageCode: "en",
  translations: [],
  image: { sourceUrl: "https://example.com/a.jpg", altText: "" },
  galleryImages: { nodes: [] },
  productCategories: { nodes: [{ slug: "jackets", parent: null }] },
  metaData: [],
} as unknown as GraphQLProduct;

const weakPost = {
  databaseId: 20,
  title: "Hi",
  slug: "hi",
  languageCode: "en",
  excerpt: "Too short",
  translations: [],
  featuredImage: { node: null },
} as unknown as GraphQLBlogPostCard;

describe("auditProduct", () => {
  it("flags description, seo, alt, and translation gaps", () => {
    const result = auditProduct(weakProduct, "en");
    const codes = result.findings.map((finding) => finding.code);

    expect(result.score).toBeGreaterThan(0);
    expect(codes).toContain("description.missing");
    expect(codes).toContain("seo.missing");
    expect(codes).toContain("alt_text.gap");
    expect(codes).toContain("translation.missing");
  });
});

describe("auditPost", () => {
  it("flags thin title, excerpt, and missing featured image", () => {
    const result = auditPost(weakPost, "en");
    const codes = result.findings.map((finding) => finding.code);

    expect(codes).toContain("title.weak");
    expect(codes).toContain("excerpt.thin");
    expect(codes).toContain("image.missing");
  });
});

describe("findDuplicateGroups", () => {
  it("groups duplicate titles", () => {
    const groups = findDuplicateGroups(
      [
        {
          entityType: "product",
          databaseId: 1,
          slug: "a",
          title: "Same Title",
          locale: "en",
          score: 1,
          findings: [],
        },
        {
          entityType: "product",
          databaseId: 2,
          slug: "b",
          title: "Same Title",
          locale: "en",
          score: 1,
          findings: [],
        },
      ],
      (item) => item.title,
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.databaseIds).toEqual([1, 2]);
  });
});
