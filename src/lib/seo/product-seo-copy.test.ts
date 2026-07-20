import { describe, expect, it } from "vitest";
import {
  buildProductSeoDescription,
  buildProductSeoTitle,
} from "@/lib/seo/product-seo-copy";

describe("buildProductSeoTitle", () => {
  it("builds brand + name + category for SERP titles", () => {
    expect(
      buildProductSeoTitle(
        {
          name: "Steel Black 02",
          brand: "Pando Moto",
          category: "pants",
          price: 289,
        },
        "en",
      ),
    ).toBe("Pando Moto Steel Black 02 — Pants & jeans");
  });

  it("avoids duplicating brand when name already includes it", () => {
    expect(
      buildProductSeoTitle(
        {
          name: "Brixton Crossfire 125",
          brand: "Brixton",
          category: "motorcycles",
          price: 3999,
        },
        "et",
      ),
    ).toBe("Brixton Crossfire 125 — Mootorrattad");
  });
});

describe("buildProductSeoDescription", () => {
  it("uses a priced template when CMS copy is missing", () => {
    const description = buildProductSeoDescription(
      {
        name: "Steel Black 02",
        brand: "Pando Moto",
        category: "pants",
        price: 289,
      },
      "en",
    );

    expect(description).toContain("Pando Moto Steel Black 02");
    expect(description).toMatch(/289/);
    expect(description).toContain("Motorock.eu");
  });

  it("keeps a strong CMS description when present", () => {
    const cms =
      "AAA-rated motorcycle jeans with Dyneema for daily commuting and weekend rides across Europe.";
    expect(
      buildProductSeoDescription(
        {
          name: "Steel Black 02",
          brand: "Pando Moto",
          price: 289,
          description: cms,
        },
        "en",
      ),
    ).toBe(cms);
  });

  it("builds Estonian fallback copy with price", () => {
    const description = buildProductSeoDescription(
      {
        name: "Crossfire 125",
        brand: "Brixton",
        price: 3999,
      },
      "et",
    );

    expect(description).toContain("Brixton Crossfire 125");
    expect(description).toMatch(/3999/);
    expect(description).toContain("Motorock.eu");
  });
});
