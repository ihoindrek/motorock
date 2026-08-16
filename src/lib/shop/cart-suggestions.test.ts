import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "@/types/catalog-product";
import {
  pickCuratedRelatedProducts,
  resolveCartSuggestions,
} from "@/lib/shop/cart-suggestions";

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

describe("pickCuratedRelatedProducts", () => {
  const anchor = product({
    slug: "jacket",
    name: "Jacket",
    category: "jackets",
  });

  it("preserves curated order and skips excluded slugs", () => {
    const related = [
      product({ slug: "pants", name: "Pants", category: "pants" }),
      product({ slug: "tee", name: "Tee", category: "t-shirts" }),
      product({ slug: "gloves", name: "Gloves", category: "gloves" }),
    ];

    expect(
      pickCuratedRelatedProducts(anchor, related, new Set(["tee"]), 3).map(
        (item) => item.slug,
      ),
    ).toEqual(["pants", "gloves"]);
  });
});

describe("resolveCartSuggestions", () => {
  const jacket = product({
    slug: "jacket",
    name: "Jacket",
    category: "jackets",
  });

  const catalog = [
    jacket,
    product({ slug: "pants", name: "Pants", category: "pants" }),
    product({ slug: "tee", name: "Tee", category: "t-shirts" }),
    product({ slug: "gloves", name: "Gloves", category: "gloves" }),
    product({ slug: "tubular", name: "Tubular", category: "scarves" }),
  ];

  it("prefers curated related products before complementary picks", () => {
    const suggestions = resolveCartSuggestions({
      anchor: jacket,
      catalog,
      curatedRelated: [
        product({ slug: "ai-pants", name: "AI Pants", category: "pants" }),
        product({ slug: "ai-tee", name: "AI Tee", category: "t-shirts" }),
      ],
      excludeSlugs: new Set(["jacket"]),
      cartCategories: new Set(["jackets"]),
      limit: 4,
    });

    expect(suggestions.map((item) => item.slug)).toEqual([
      "ai-pants",
      "ai-tee",
      "gloves",
      "tubular",
    ]);
  });
});
