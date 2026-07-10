import { describe, expect, it } from "vitest";
import type { CartLine } from "@/context/cart-context";
import {
  fetchEnglishCheckoutProduct,
  resolveCheckoutProductIds,
  type CheckoutResolvableProduct,
} from "@/lib/graphql/resolve-checkout-product-ids";

const line: CartLine = {
  slug: "maya-sox",
  name: "Maya Sox",
  price: 9.9,
  image: "/test.jpg",
  quantity: 1,
  size: "M",
  productId: 28299,
  variationId: 28301,
};

const etSimple: CheckoutResolvableProduct = {
  databaseId: 28299,
  languageCode: "et",
  translations: [{ databaseId: 24710, language: { code: "en" } }],
  __typename: "SimpleProduct",
};

const enSimple: CheckoutResolvableProduct = {
  databaseId: 24710,
  languageCode: "en",
  __typename: "SimpleProduct",
};

const enVariable: CheckoutResolvableProduct = {
  databaseId: 100,
  languageCode: "en",
  __typename: "VariableProduct",
  variations: {
    nodes: [
      {
        databaseId: 201,
        attributes: {
          nodes: [{ name: "pa_size", value: "M" }],
        },
      },
      {
        databaseId: 202,
        attributes: {
          nodes: [{ name: "pa_size", value: "L" }],
        },
      },
    ],
  },
};

describe("fetchEnglishCheckoutProduct", () => {
  it("returns EN product when localized product is ET", async () => {
    const english = await fetchEnglishCheckoutProduct(etSimple, async (id) =>
      id === 24710 ? enSimple : null,
    );

    expect(english.databaseId).toBe(24710);
  });

  it("returns same product when already EN", async () => {
    const english = await fetchEnglishCheckoutProduct(enSimple, async () => null);
    expect(english.databaseId).toBe(24710);
  });
});

describe("resolveCheckoutProductIds", () => {
  it("uses EN simple product id", () => {
    expect(
      resolveCheckoutProductIds(enSimple, line, {
        isOneSizeLabel: () => false,
        sizesMatch: (left, right) => left === right,
      }),
    ).toEqual({ productId: 24710 });
  });

  it("uses EN variation id matched by cart size", () => {
    expect(
      resolveCheckoutProductIds(enVariable, line, {
        isOneSizeLabel: () => false,
        sizesMatch: (left, right) => left === right,
      }),
    ).toEqual({ productId: 100, variationId: 201 });
  });
});
