import { describe, expect, it } from "vitest";
import { validateRelatedProductsOutput } from "@/lib/commerce-ai/catalog/validate-related-output";

describe("validateRelatedProductsOutput", () => {
  const allowed = new Set(["bike-a", "bike-b", "bike-c", "bike-d"]);

  it("accepts valid slugs from the candidate set", () => {
    const result = validateRelatedProductsOutput(
      {
        relatedSlugs: ["bike-a", "bike-b", "bike-c"],
        items: [
          { slug: "bike-a", reason: "Same brand, similar displacement." },
          { slug: "bike-b", reason: "Popular upgrade path." },
          { slug: "bike-c", reason: "Alternative styling." },
        ],
      },
      { currentSlug: "current-bike", allowedSlugs: allowed },
    );

    expect(result).toEqual({
      ok: true,
      relatedSlugs: ["bike-a", "bike-b", "bike-c"],
    });
  });

  it("rejects unknown slugs and self references", () => {
    const result = validateRelatedProductsOutput(
      {
        relatedSlugs: ["current-bike", "unknown-bike", "bike-a", "bike-b"],
        items: [
          { slug: "current-bike", reason: "Self." },
          { slug: "unknown-bike", reason: "Unknown." },
          { slug: "bike-a", reason: "Valid." },
          { slug: "bike-b", reason: "Valid." },
        ],
      },
      { currentSlug: "current-bike", allowedSlugs: allowed },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((error) => error.includes("current product"))).toBe(true);
      expect(result.errors.some((error) => error.includes("unknown-bike"))).toBe(true);
    }
  });
});
