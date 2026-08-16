import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "@/types/catalog-product";
import {
  mergeSuggestionCandidates,
  pickCartComplementaryProducts,
} from "@/lib/shop/cart-complementary-products";

function product(
  overrides: Partial<CatalogProduct> & Pick<CatalogProduct, "slug" | "name" | "category">,
): CatalogProduct {
  return {
    brand: "Holyfreedom",
    price: 100,
    image: "/product.jpg",
    lifestyleImage: "/product.jpg",
    type: "equipment",
    gender: "men",
    sizes: ["M"],
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

describe("pickCartComplementaryProducts", () => {
  const jacket = product({
    slug: "winter-jacket",
    name: "Winter Jacket",
    category: "jackets",
  });

  const catalog = [
    jacket,
    product({
      slug: "other-jacket",
      name: "Other Jacket",
      category: "jackets",
    }),
    product({
      slug: "riding-pants",
      name: "Riding Pants",
      category: "pants",
    }),
    product({
      slug: "crew-tee",
      name: "Crew Tee",
      category: "t-shirts",
    }),
    product({
      slug: "summer-gloves",
      name: "Summer Gloves",
      category: "gloves",
    }),
    product({
      slug: "oro-tubular",
      name: "Oro Tubular",
      category: "scarves",
    }),
    product({
      slug: "other-brand-gloves",
      name: "Other Brand Gloves",
      brand: "Pando Moto",
      category: "gloves",
    }),
  ];

  it("suggests one product per category instead of another jacket", () => {
    const suggestions = pickCartComplementaryProducts(jacket, catalog, {
      excludeSlugs: new Set(["winter-jacket"]),
      cartCategories: new Set(["jackets"]),
      limit: 4,
    });

    expect(suggestions.map((item) => item.slug)).toEqual([
      "riding-pants",
      "crew-tee",
      "summer-gloves",
      "oro-tubular",
    ]);
  });

  it("prefers the same brand within a category", () => {
    const suggestions = pickCartComplementaryProducts(jacket, catalog, {
      excludeSlugs: new Set(["winter-jacket", "riding-pants", "crew-tee", "oro-tubular"]),
      cartCategories: new Set(["jackets", "pants", "t-shirts", "scarves"]),
      limit: 1,
    });

    expect(suggestions.map((item) => item.slug)).toEqual(["summer-gloves"]);
  });

  it("skips categories already represented in the cart", () => {
    const suggestions = pickCartComplementaryProducts(jacket, catalog, {
      excludeSlugs: new Set(["winter-jacket", "riding-pants"]),
      cartCategories: new Set(["jackets", "pants"]),
      limit: 3,
    });

    expect(suggestions.map((item) => item.slug)).toEqual([
      "crew-tee",
      "summer-gloves",
      "oro-tubular",
    ]);
  });
});

describe("mergeSuggestionCandidates", () => {
  const jacket = product({
    slug: "winter-jacket",
    name: "Winter Jacket",
    category: "jackets",
  });

  it("keeps one product per category when merging fallback candidates", () => {
    const merged = mergeSuggestionCandidates(
      jacket,
      [product({ slug: "crew-tee", name: "Crew Tee", category: "t-shirts" })],
      [
        product({ slug: "another-tee", name: "Another Tee", category: "t-shirts" }),
        product({ slug: "summer-gloves", name: "Summer Gloves", category: "gloves" }),
      ],
      {
        cartCategories: new Set(["jackets"]),
        limit: 3,
      },
    );

    expect(merged.map((item) => item.category)).toEqual(["t-shirts", "gloves"]);
  });
});
