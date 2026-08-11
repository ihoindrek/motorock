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

  it("prefers Meta catalog EN variation id on localized cart lines", () => {
    const line: CartLine = {
      slug: "3d-t-sark-pastellroosa",
      name: "3D T-särk (pastellroosa)",
      price: 29,
      image: "/tee.webp",
      quantity: 1,
      size: "M",
      productId: 28591,
      variationId: 27805,
      metaCatalogProductId: 24203,
      metaCatalogVariationId: 24213,
    };

    expect(mapCartLineToGa4Item(line).item_id).toBe("24213");
  });

  it("uses metaCatalogProductId on catalog product rows", () => {
    expect(
      mapCatalogProductToGa4Item(
        {
          slug: "3d-t-sark-pastellroosa",
          name: "3D T-särk (pastellroosa)",
          brand: "Motogirl",
          price: 29,
          type: "equipment",
          category: "t-shirts",
          databaseId: 28591,
          metaCatalogProductId: 24203,
          metaCatalogVariationIds: { M: 24213, m: 24213 },
          variationIds: { M: 27805, m: 27805 },
          sizes: ["XS", "S", "M", "L", "XL", "2XL"],
        },
        undefined,
        { size: "M", variationId: 27805 },
      ).item_id,
    ).toBe("24213");
  });

  it("ignores localized Woo variation id when meta catalog product id is set", () => {
    const line: CartLine = {
      slug: "3d-t-sark-pastellroosa",
      name: "3D T-särk (pastellroosa)",
      price: 29,
      image: "/tee.webp",
      quantity: 1,
      size: "M",
      productId: 28591,
      variationId: 27805,
      metaCatalogProductId: 24203,
    };

    expect(mapCartLineToGa4Item(line).item_id).toBe("24203");
  });

  it("rejects ET variation id on localized PDP view_item mapping", () => {
    expect(
      mapCatalogProductToGa4Item(
        {
          slug: "3d-t-sark-pastellroosa",
          name: "3D T-särk (pastellroosa)",
          brand: "Motogirl",
          price: 29,
          type: "equipment",
          category: "t-shirts",
          databaseId: 28591,
          metaCatalogProductId: 24203,
          metaCatalogVariationIds: { M: 24213, m: 24213 },
          variationIds: { M: 27805, m: 27805 },
          sizes: ["XS", "S", "M", "L", "XL", "2XL"],
        },
        undefined,
        { variationId: 27805, size: "M" },
      ).item_id,
    ).toBe("24213");
  });
});
