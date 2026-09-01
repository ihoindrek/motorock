import { describe, expect, it } from "vitest";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  matchBrandGendersFromParam,
  productMatchesBrandGenderFilter,
  resolveAvailableBrandGenders,
  shouldShowBrandGenderFilter,
} from "@/lib/shop/brand-gender-filter";
import type { CatalogProduct } from "@/types/catalog-product";

function product(
  partial: Partial<CatalogProduct> & Pick<CatalogProduct, "slug">,
): CatalogProduct {
  return {
    name: partial.slug,
    brand: "Holyfreedom",
    price: 100,
    sku: partial.slug,
    image: "/x.webp",
    lifestyleImage: "/x.webp",
    type: "equipment",
    gender: "unisex",
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

describe("brand gender filter", () => {
  const dict = getDictionary("en");

  it("uses shopAudiences when present", () => {
    const unisexBoth = product({
      slug: "both",
      shopAudiences: ["men", "women"],
    });

    expect(productMatchesBrandGenderFilter(unisexBoth, "men")).toBe(true);
    expect(productMatchesBrandGenderFilter(unisexBoth, "women")).toBe(true);
  });

  it("falls back to product gender without shopAudiences", () => {
    expect(
      productMatchesBrandGenderFilter(
        product({ slug: "men-jacket", gender: "men" }),
        "men",
      ),
    ).toBe(true);
    expect(
      productMatchesBrandGenderFilter(
        product({ slug: "men-jacket", gender: "men" }),
        "women",
      ),
    ).toBe(false);
  });

  it("lists genders present in the brand catalog", () => {
    const options = resolveAvailableBrandGenders(
      [
        product({ slug: "men-jacket", gender: "men" }),
        product({ slug: "women-jacket", gender: "women" }),
      ],
      dict,
    );

    expect(options.map((option) => option.id)).toEqual(["men", "women"]);
  });

  it("shows the filter only when both genders are available", () => {
    const both = resolveAvailableBrandGenders(
      [
        product({ slug: "men-jacket", gender: "men" }),
        product({ slug: "women-jacket", gender: "women" }),
      ],
      dict,
    );
    const menOnly = resolveAvailableBrandGenders(
      [product({ slug: "men-jacket", gender: "men" })],
      dict,
    );

    expect(shouldShowBrandGenderFilter("Holyfreedom", both)).toBe(true);
    expect(shouldShowBrandGenderFilter("Holyfreedom", menOnly)).toBe(false);
    expect(shouldShowBrandGenderFilter(undefined, both)).toBe(false);
  });

  it("matches gender ids from the URL param", () => {
    const options = resolveAvailableBrandGenders(
      [
        product({ slug: "men-jacket", gender: "men" }),
        product({ slug: "women-jacket", gender: "women" }),
      ],
      dict,
    );

    expect(matchBrandGendersFromParam("men", options)).toEqual(["men"]);
    expect(matchBrandGendersFromParam("men,women", options)).toEqual([
      "men",
      "women",
    ]);
    expect(matchBrandGendersFromParam("unknown", options)).toEqual([]);
  });
});
