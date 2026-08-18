import { describe, expect, it } from "vitest";
import {
  resolveCategoryFilterFacets,
  type CategoryRoute,
} from "@/lib/shop/category";
import type { CatalogProduct } from "@/types/catalog-product";

function product(brand: string): CatalogProduct {
  return {
    slug: brand.toLowerCase().replace(/\s+/g, "-"),
    name: `${brand} item`,
    brand,
    price: 100,
    sku: "sku",
    image: "/x.webp",
    lifestyleImage: "/x.webp",
    type: "equipment",
    gender: "women",
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
  };
}

describe("resolveCategoryFilterFacets", () => {
  it("shows brand filter on equipment category pages even with one brand", () => {
    const route: CategoryRoute = {
      title: "For women",
      description: "",
      breadcrumbs: [],
      gender: "women",
      wcCategorySlug: "for-women",
    };

    const facets = resolveCategoryFilterFacets(route, [product("Motogirl")]);
    expect(facets.showBrandFilter).toBe(true);
    expect(facets.showDisplacementFilter).toBe(false);
  });

  it("hides brand filter on single-brand archive routes", () => {
    const route: CategoryRoute = {
      title: "Pando Moto",
      description: "",
      breadcrumbs: [],
      brand: "Pando Moto",
    };

    const facets = resolveCategoryFilterFacets(route, [
      product("Pando Moto"),
      product("Pando Moto"),
    ]);
    expect(facets.showBrandFilter).toBe(false);
    expect(facets.showCategoryFilter).toBe(false);
    expect(facets.showDisplacementFilter).toBe(false);
  });
});
