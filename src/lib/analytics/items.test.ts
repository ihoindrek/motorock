import { describe, expect, it } from "vitest";
import {
  mapCartLineToGa4Item,
  mapCatalogProductToGa4Item,
  mapOrderSummaryItemsToGa4Items,
  sumLineValue,
} from "@/lib/analytics/items";
import type { CartLine } from "@/context/cart-context";

describe("analytics items", () => {
  it("maps catalog products to GA4 items", () => {
    expect(
      mapCatalogProductToGa4Item({
        slug: "capo-cor",
        name: "Capo Cor",
        brand: "Pando Moto",
        price: 199,
        type: "equipment",
        category: "jackets",
        sku: "CAPO-01",
        databaseId: 42,
      }),
    ).toEqual({
      item_id: "42",
      item_name: "Capo Cor",
      item_brand: "Pando Moto",
      item_category: "Jackets",
      price: 199,
      quantity: 1,
      index: undefined,
    });
  });

  it("maps cart lines with variant and totals", () => {
    const line: CartLine = {
      slug: "capo-cor",
      name: "Capo Cor",
      price: 199,
      image: "/capo.webp",
      brand: "Pando Moto",
      type: "equipment",
      quantity: 2,
      size: "M",
      color: "Black",
      productId: 42,
      variationId: 99,
    };

    expect(mapCartLineToGa4Item(line, 0)).toEqual({
      item_id: "99",
      item_name: "Capo Cor",
      item_brand: "Pando Moto",
      item_category: "Equipment",
      item_variant: "M / Black",
      price: 199,
      quantity: 2,
      index: 0,
    });

    expect(sumLineValue([line])).toBe(398);
  });

  it("maps order summary items with Woo product ids", () => {
    expect(
      mapOrderSummaryItemsToGa4Items([
        {
          name: "Capo Cor",
          quantity: 1,
          total: 199,
          productId: 286,
          sku: "CAPO-01",
        },
      ]),
    ).toEqual([
      {
        item_id: "286",
        item_name: "Capo Cor",
        price: 199,
        quantity: 1,
        index: 0,
      },
    ]);
  });

  it("prefers variation id for Meta catalog matching", () => {
    expect(
      mapCatalogProductToGa4Item(
        {
          slug: "3d-tee",
          name: "3D T-Shirt",
          brand: "Brand",
          price: 29,
          type: "equipment",
          category: "t-shirts",
          databaseId: 22390,
        },
        undefined,
        22398,
      ).item_id,
    ).toBe("22398");
  });
});
