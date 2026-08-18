import { describe, expect, it } from "vitest";
import {
  matchDisplacementsFromParam,
  resolveAvailableDisplacements,
  resolveProductDisplacement,
  shouldShowMotorcycleDisplacementFilter,
} from "@/lib/shop/motorcycle-displacement";
import type { CatalogProduct } from "@/types/catalog-product";

function motorcycle(
  overrides: Partial<CatalogProduct> & Pick<CatalogProduct, "slug" | "name">,
): CatalogProduct {
  return {
    brand: "Brixton",
    price: 5000,
    sku: "sku",
    image: "/x.webp",
    lifestyleImage: "/x.webp",
    type: "motorcycle",
    gender: "unisex",
    category: "motorcycles",
    sizes: [],
    colors: [],
    inStock: true,
    isNew: false,
    tagline: "",
    description: "",
    specs: [],
    features: [],
    backHref: "/shop/motorcycles",
    backLabel: "Motorcycles",
    ...overrides,
  };
}

describe("motorcycle displacement filter", () => {
  it("reads displacement from engine specs", () => {
    const product = motorcycle({
      slug: "crossfire-125",
      name: "Crossfire",
      engineSpecs: [{ id: "cap", label: "Engine capacity", value: "124.8 cc" }],
    });

    expect(resolveProductDisplacement(product)).toBe(125);
  });

  it("falls back to model name and slug", () => {
    expect(
      resolveProductDisplacement(
        motorcycle({ slug: "motron-revolver-125", name: "Revolver 125" }),
      ),
    ).toBe(125);
    expect(
      resolveProductDisplacement(
        motorcycle({ slug: "crossfire-500-storr", name: "Crossfire 500 STORR" }),
      ),
    ).toBe(500);
  });

  it("ignores model years in the product title", () => {
    expect(
      resolveProductDisplacement(
        motorcycle({
          slug: "cromwell-1200x",
          name: "Cromwell 1200X 2024",
        }),
      ),
    ).toBe(1200);
  });

  it("builds available displacement options and URL matches", () => {
    const available = resolveAvailableDisplacements([
      motorcycle({ slug: "a-125", name: "A 125" }),
      motorcycle({ slug: "b-125", name: "B 125" }),
      motorcycle({ slug: "c-500", name: "C 500" }),
    ]);

    expect(available).toEqual([125, 500]);
    expect(matchDisplacementsFromParam("125,500", available)).toEqual([125, 500]);
    expect(
      shouldShowMotorcycleDisplacementFilter("motorcycles", available),
    ).toBe(true);
  });
});
