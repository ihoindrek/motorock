import { describe, expect, it } from "vitest";
import { filterProductsByRoute, type CategoryRoute } from "@/lib/shop/category";
import { collectProductWcCategorySlugs } from "@/lib/shop/wc-categories";
import type { CatalogProduct } from "@/types/catalog-product";

function product(
  partial: Partial<CatalogProduct> & Pick<CatalogProduct, "slug" | "brand">,
): CatalogProduct {
  return {
    name: partial.slug,
    price: 100,
    sku: partial.slug,
    image: "/x.webp",
    lifestyleImage: "/x.webp",
    type: "equipment",
    gender: "women",
    category: "pants",
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

describe("collectProductWcCategorySlugs", () => {
  it("includes parent category slugs", () => {
    expect(
      collectProductWcCategorySlugs([
        {
          slug: "pants-jeans",
          parent: { node: { slug: "for-women" } },
        },
      ]),
    ).toEqual(["pants-jeans", "for-women"]);
  });
});

describe("filterProductsByRoute for-women", () => {
  const route: CategoryRoute = {
    title: "For women",
    description: "",
    breadcrumbs: [],
    gender: "women",
    wcCategorySlug: "for-women",
  };

  it("keeps Motogirl products that only list a child category slug", () => {
    const products = [
      product({
        slug: "motogirl-pants",
        brand: "Motogirl",
        gender: "women",
        shopAudiences: ["women"],
        wcCategorySlugs: ["pants-jeans"],
      }),
      product({
        slug: "pando-tee",
        brand: "Pando Moto",
        gender: "unisex",
        shopAudiences: ["men", "women"],
        wcCategorySlugs: ["for-women", "t-shirts"],
      }),
    ];

    const filtered = filterProductsByRoute(products, route);
    expect(filtered.map((item) => item.brand).sort()).toEqual([
      "Motogirl",
      "Pando Moto",
    ]);
  });
});
