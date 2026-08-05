import { describe, expect, it } from "vitest";
import { fallbackSizeGuides } from "@/data/size-guides/catalog";
import { buildSizeGuideRegistry } from "@/lib/shop/size-guide-registry";
import { resolveSizeGuide } from "@/lib/shop/resolve-size-guide";
import type { CatalogProduct } from "@/types/catalog-product";

function product(
  overrides: Partial<CatalogProduct> & Pick<CatalogProduct, "slug" | "name">,
): CatalogProduct {
  return {
    brand: "Test",
    price: 10,
    image: "/product.jpg",
    lifestyleImage: "/product.jpg",
    type: "equipment",
    gender: "men",
    category: "jackets",
    sizes: ["S", "M", "L"],
    colors: [],
    inStock: true,
    isNew: false,
    tagline: "",
    description: "",
    specs: [],
    features: [],
    backHref: "/",
    backLabel: "Back",
    ...overrides,
  };
}

describe("resolveSizeGuide", () => {
  const registry = buildSizeGuideRegistry(fallbackSizeGuides);

  it("returns null for one-size products", () => {
    expect(
      resolveSizeGuide(
        product({
          slug: "hat",
          name: "Hat",
          sizes: ["One size"],
        }),
        registry,
      ),
    ).toBeNull();
  });

  it("matches brand, category, and gender", () => {
    const guide = resolveSizeGuide(
      product({
        slug: "pando-jacket",
        name: "Jacket",
        brand: "Pando Moto",
        category: "jackets",
        gender: "men",
        sizes: ["M", "L"],
      }),
      registry,
    );

    expect(guide?.id).toBe("pando-moto-jackets-men");
    expect(guide?.rows.map((row) => row.size)).toEqual(["M", "L"]);
  });

  it("falls back to unisex chart when gender-specific chart is missing", () => {
    const guide = resolveSizeGuide(
      product({
        slug: "holy-hoodie",
        name: "Hoodie",
        brand: "Holyfreedom",
        category: "hoodies",
        gender: "men",
        sizes: ["M", "L"],
      }),
      registry,
    );

    expect(guide?.id).toBe("holyfreedom-hoodies-unisex");
  });

  it("uses product slug override when set", () => {
    const guide = resolveSizeGuide(
      product({
        slug: "custom-pants",
        name: "Custom pants",
        brand: "Unknown Brand",
        category: "accessories",
        sizeGuideSlug: "johnny-reb-pants-men",
        sizes: ["32", "34"],
      }),
      registry,
    );

    expect(guide?.id).toBe("johnny-reb-pants-men");
    expect(guide?.rows.map((row) => row.size)).toEqual(["32", "34"]);
  });
});
