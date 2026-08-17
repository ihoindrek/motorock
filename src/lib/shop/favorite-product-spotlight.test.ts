import { describe, expect, it } from "vitest";
import { pickHomepageSpotlightProducts } from "@/lib/shop/favorite-product";
import type { CatalogProduct } from "@/types/catalog-product";

function tee(brand: string, slug: string): CatalogProduct {
  return {
    slug,
    name: `${brand} Tee`,
    brand,
    price: 49,
    sku: slug,
    image: "/x.webp",
    lifestyleImage: "/x.webp",
    type: "equipment",
    gender: "men",
    category: "t-shirts",
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
  };
}

describe("pickHomepageSpotlightProducts", () => {
  it("prefers one tee per brand when no brand filter is set", () => {
    const products = [
      tee("Holyfreedom", "hf-1"),
      tee("Holyfreedom", "hf-2"),
      tee("John Doe", "jd-1"),
      tee("Pando Moto", "pm-1"),
      tee("Rev'it", "rv-1"),
    ];

    const picked = pickHomepageSpotlightProducts(
      {
        id: "tshirts",
        categories: ["t-shirts"],
        wcCategorySlugs: ["t-shirts"],
        limit: 4,
      },
      products,
      "en",
    );

    expect(picked).toHaveLength(4);
    expect(new Set(picked.map((product) => product.brand)).size).toBe(4);
  });
});
