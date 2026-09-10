import { describe, expect, it } from "vitest";
import {
  productHasMappedCategory,
  resolveAllProductCategoriesFromWcNodes,
} from "@/lib/shop/wc-categories";
import type { CatalogProduct } from "@/types/catalog-product";

function product(
  partial: Partial<CatalogProduct> & Pick<CatalogProduct, "category">,
): CatalogProduct {
  return {
    slug: "test-product",
    name: "Test Product",
    brand: "Test",
    price: 100,
    image: "/x.webp",
    lifestyleImage: "/x.webp",
    type: "equipment",
    gender: "women",
    sizes: ["M"],
    colors: ["Black"],
    inStock: true,
    isNew: false,
    tagline: "",
    description: "",
    specs: [],
    features: [],
    backHref: "/shop/equipment",
    backLabel: "Equipment",
    ...partial,
  };
}

describe("resolveAllProductCategoriesFromWcNodes", () => {
  it("returns every mapped Woo leaf category", () => {
    expect(
      resolveAllProductCategoriesFromWcNodes(
        ["jackets-and-tags-2", "for-women", "rain-gear-2"],
        "Aqua Waterproof Jacket",
      ),
    ).toEqual(["jackets", "rain-gear"]);
  });
});

describe("productHasMappedCategory", () => {
  it("matches any assigned category, not only the primary one", () => {
    const entry = product({
      category: "jackets",
      categories: ["jackets", "rain-gear"],
      wcCategorySlugs: ["jackets-and-tags-2", "for-women", "rain-gear-2"],
    });

    expect(productHasMappedCategory(entry, "jackets")).toBe(true);
    expect(productHasMappedCategory(entry, "rain-gear")).toBe(true);
    expect(productHasMappedCategory(entry, "pants")).toBe(false);
  });
});
