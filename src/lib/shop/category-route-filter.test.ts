import { describe, expect, it } from "vitest";
import { filterProductsByRoute, type CategoryRoute } from "@/lib/shop/category";
import type { CatalogProduct } from "@/types/catalog-product";

function product(
  partial: Partial<CatalogProduct> & Pick<CatalogProduct, "slug" | "brand">,
): CatalogProduct {
  return {
    name: partial.name ?? partial.slug,
    price: 100,
    sku: partial.slug,
    image: "/x.webp",
    lifestyleImage: "/x.webp",
    type: "equipment",
    gender: "men",
    category: "jackets",
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

describe("filterProductsByRoute men's jackets leaf", () => {
  const route: CategoryRoute = {
    title: "Jackets and tags",
    description: "",
    breadcrumbs: [],
    gender: "men",
    wcCategorySlug: "jackets-and-tags",
    wcCategoryPath: ["for-men", "jackets-and-tags"],
  };

  it("excludes women's trousers miscategorized in men's jackets", () => {
    const filtered = filterProductsByRoute(
      [
        product({
          slug: "fiona-trousers",
          brand: "Motogirl",
          name: "Fiona Black Leather Trousers",
          gender: "women",
          category: "pants",
          shopAudiences: ["men", "women"],
          wcCategorySlugs: ["jackets-and-tags", "for-men", "pants-jeans", "for-women"],
        }),
      ],
      route,
    );

    expect(filtered).toHaveLength(0);
  });

  it("excludes women's jackets that also list the women's leaf slug", () => {
    const filtered = filterProductsByRoute(
      [
        product({
          slug: "fiona-jacket",
          brand: "Motogirl",
          name: "Fiona Yellow Leather Jacket",
          gender: "unisex",
          category: "jackets",
          shopAudiences: ["men", "women"],
          wcCategorySlugs: [
            "jackets-and-tags",
            "for-men",
            "jackets-and-tags-2",
            "for-women",
          ],
        }),
      ],
      route,
    );

    expect(filtered).toHaveLength(0);
  });

  it("excludes products whose name indicates the opposite gender", () => {
    const filtered = filterProductsByRoute(
      [
        product({
          slug: "womens-hawkesbury",
          brand: "Johnny Reb",
          name: "Women's Hawkesbury Leather Jacket | Removable Hood",
          gender: "men",
          category: "jackets",
          shopAudiences: ["men"],
          wcCategorySlugs: ["jackets-and-tags", "for-men"],
        }),
      ],
      route,
    );

    expect(filtered).toHaveLength(0);
  });

  it("keeps unisex jackets without a women's leaf slug", () => {
    const filtered = filterProductsByRoute(
      [
        product({
          slug: "husky-jacket",
          brand: "Pando Moto",
          name: "HUSKY JACKET BLACK – Sherpa Trucker Motorcycle Jacket Unisex",
          gender: "unisex",
          category: "jackets",
          shopAudiences: ["men", "women"],
          wcCategorySlugs: ["jackets-and-tags", "for-men", "for-women"],
        }),
      ],
      route,
    );

    expect(filtered).toHaveLength(1);
  });

  it("keeps multi-category rain gear visible on the jackets leaf route too", () => {
    const jacketsRoute: CategoryRoute = {
      title: "Jackets and tags",
      description: "",
      breadcrumbs: [],
      gender: "women",
      wcCategorySlug: "jackets-and-tags-2",
      wcCategoryPath: ["for-women", "jackets-and-tags-2"],
    };

    const filtered = filterProductsByRoute(
      [
        product({
          slug: "aqua-waterproof-jacket",
          brand: "Holyfreedom",
          name: "Aqua Waterproof Jacket",
          gender: "women",
          category: "jackets",
          categories: ["jackets", "rain-gear"],
          shopAudiences: ["women"],
          wcCategorySlugs: ["jackets-and-tags-2", "for-women", "rain-gear"],
        }),
      ],
      jacketsRoute,
    );

    expect(filtered.map((product) => product.slug)).toEqual([
      "aqua-waterproof-jacket",
    ]);
  });

  it("keeps women's rain gear when product also maps to jackets or pants", () => {
    const rainRoute: CategoryRoute = {
      title: "Rain Gear",
      description: "",
      breadcrumbs: [],
      gender: "women",
      wcCategorySlug: "rain-gear",
      wcCategoryPath: ["for-women", "rain-gear"],
    };

    const filtered = filterProductsByRoute(
      [
        product({
          slug: "aqua-waterproof-jacket",
          brand: "Holyfreedom",
          name: "Aqua Waterproof Jacket",
          gender: "women",
          category: "jackets",
          shopAudiences: ["women"],
          wcCategorySlugs: ["jackets-and-tags-2", "for-women", "rain-gear"],
        }),
        product({
          slug: "aqua-waterproof-trousers",
          brand: "Holyfreedom",
          name: "Aqua Waterproof Trousers",
          gender: "women",
          category: "pants",
          shopAudiences: ["women"],
          wcCategorySlugs: ["pants-jeans", "for-women", "rain-gear"],
        }),
      ],
      rainRoute,
    );

    expect(filtered.map((product) => product.slug)).toEqual([
      "aqua-waterproof-jacket",
      "aqua-waterproof-trousers",
    ]);
  });

  it("keeps men's rain gear when rain-gear slug is shared across genders", () => {
    const rainRoute: CategoryRoute = {
      title: "Rain Gear",
      description: "",
      breadcrumbs: [],
      gender: "men",
      wcCategorySlug: "rain-gear",
      wcCategoryPath: ["for-men", "rain-gear"],
    };

    const filtered = filterProductsByRoute(
      [
        product({
          slug: "bobhead-waterproof-jacket",
          brand: "Bobhead",
          name: "BOBHEAD Waterproof Jacket",
          gender: "men",
          category: "rain-gear",
          shopAudiences: ["men"],
          wcCategorySlugs: ["rain-gear", "for-men"],
        }),
        product({
          slug: "bobhead-waterproof-pant-womens",
          brand: "Bobhead",
          name: "BOBHEAD Waterproof Pant Women's",
          gender: "women",
          category: "rain-gear",
          shopAudiences: ["women"],
          wcCategorySlugs: ["rain-gear", "for-women"],
        }),
      ],
      rainRoute,
    );

    expect(filtered.map((product) => product.slug)).toEqual([
      "bobhead-waterproof-jacket",
    ]);
  });

  it("keeps men's jackets in the correct category", () => {
    const filtered = filterProductsByRoute(
      [
        product({
          slug: "commando-jacket",
          brand: "Pando Moto",
          name: "COMMANDO UH BLACK Men's Light-Weight Motorcycle Jacket",
          gender: "men",
          category: "jackets",
          shopAudiences: ["men"],
          wcCategorySlugs: ["jackets-and-tags", "for-men"],
        }),
      ],
      route,
    );

    expect(filtered).toHaveLength(1);
  });
});
