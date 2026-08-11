import { describe, expect, it } from "vitest";
import {
  attachMetaCatalogFields,
  resolveMetaCatalogVariationId,
} from "@/lib/analytics/meta-catalog-id";

describe("resolveMetaCatalogVariationId", () => {
  const localizedProduct = {
    databaseId: 28591,
    metaCatalogProductId: 24203,
    metaCatalogVariationIds: { M: 24213, m: 24213 },
    variationIds: { M: 27805, m: 27805 },
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
  };

  it("maps size to EN meta catalog variation id on ET product pages", () => {
    expect(
      resolveMetaCatalogVariationId(localizedProduct, {
        size: "M",
        variationId: 27805,
      }),
    ).toBe(24213);
  });

  it("rejects localized Woo variation id when meta map is missing", () => {
    expect(
      resolveMetaCatalogVariationId(
        {
          databaseId: 28591,
          metaCatalogProductId: 24203,
          variationIds: { M: 27805 },
          sizes: ["M"],
        },
        { variationId: 27805, size: "M" },
      ),
    ).toBeUndefined();
  });
});

describe("attachMetaCatalogFields", () => {
  it("overlays explicit server meta catalog ids onto the product", () => {
    expect(
      attachMetaCatalogFields(
        { databaseId: 28591, slug: "x", sizes: ["M"] } as never,
        { productId: 24203, variationIds: { M: 24213 } },
      ),
    ).toEqual({
      databaseId: 28591,
      slug: "x",
      sizes: ["M"],
      metaCatalogProductId: 24203,
      metaCatalogVariationIds: { M: 24213 },
    });
  });
});
