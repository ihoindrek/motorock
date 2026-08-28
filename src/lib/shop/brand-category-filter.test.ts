import { describe, expect, it } from "vitest";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  matchProductCategoriesFromParam,
  resolveAvailableProductCategories,
  shouldShowBrandProductCategoryFilter,
} from "@/lib/shop/brand-category-filter";
import type { CatalogProduct } from "@/types/catalog-product";

function product(category: CatalogProduct["category"]): CatalogProduct {
  return {
    slug: `${category}-item`,
    name: `${category} item`,
    brand: "Holyfreedom",
    price: 100,
    sku: "sku",
    image: "/x.webp",
    lifestyleImage: "/x.webp",
    type: "equipment",
    gender: "women",
    category,
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

describe("brand category filter", () => {
  const dict = getDictionary("en");

  it("lists product categories present in the brand catalog", () => {
    const options = resolveAvailableProductCategories(
      [product("jackets"), product("t-shirts"), product("motorcycles")],
      dict,
    );

    expect(options.map((option) => option.id)).toEqual(["jackets", "t-shirts"]);
  });

  it("shows the filter only on brand pages with multiple categories", () => {
    const options = resolveAvailableProductCategories(
      [product("jackets"), product("hoodies")],
      dict,
    );

    expect(shouldShowBrandProductCategoryFilter("Holyfreedom", options)).toBe(
      true,
    );
    expect(shouldShowBrandProductCategoryFilter(undefined, options)).toBe(false);
    expect(
      shouldShowBrandProductCategoryFilter(
        "Holyfreedom",
        resolveAvailableProductCategories([product("jackets")], dict),
      ),
    ).toBe(false);
  });

  it("matches category ids from the URL param", () => {
    const options = resolveAvailableProductCategories(
      [product("jackets"), product("t-shirts")],
      dict,
    );

    expect(matchProductCategoriesFromParam("jackets,t-shirts", options)).toEqual([
      "jackets",
      "t-shirts",
    ]);
    expect(matchProductCategoriesFromParam("unknown", options)).toEqual([]);
  });

  it("hides the other category from brand filters", () => {
    const options = resolveAvailableProductCategories(
      [product("jackets"), product("other")],
      dict,
    );

    expect(options.map((option) => option.id)).toEqual(["jackets"]);
  });
});
