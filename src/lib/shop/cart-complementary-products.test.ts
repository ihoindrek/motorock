import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "@/types/catalog-product";
import { pickCartComplementaryProducts } from "@/lib/shop/cart-complementary-products";

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
  ];

  it("suggests other categories instead of another jacket", () => {
    const suggestions = pickCartComplementaryProducts(jacket, catalog, {
      excludeSlugs: new Set(["winter-jacket"]),
      cartCategories: new Set(["jackets"]),
      limit: 3,
    });

    expect(suggestions.map((item) => item.slug)).toEqual([
      "riding-pants",
      "crew-tee",
      "summer-gloves",
    ]);
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
    ]);
  });
});
