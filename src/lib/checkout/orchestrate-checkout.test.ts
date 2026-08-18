import { describe, expect, it } from "vitest";
import {
  buildCheckoutPickupNote,
  buildRemintLineItems,
} from "@/lib/checkout/orchestrate-checkout";
import { MONTONIO_PAYMENT_METHOD_ID } from "@/lib/graphql/checkout";

describe("buildCheckoutPickupNote", () => {
  it("combines pickup point and Montonio provider details", () => {
    const note = buildCheckoutPickupNote({
      paymentMethodId: MONTONIO_PAYMENT_METHOD_ID,
      pickupPoint: {
        id: "123",
        name: "T1",
        address: "Street 1",
        city: "Tallinn",
        postcode: "10111",
        carrier: "omniva",
        montonioItemId: "uuid",
      },
      montonioOption: {
        kind: "bank",
        code: "LHVBEE22",
        name: "LHV",
        logoUrl: null,
        systemName: "paymentInitiation",
      },
    });

    expect(note).toContain("Pakiautomaat: T1");
    expect(note).toContain("Montonio: paymentInitiation / LHVBEE22");
  });
});

describe("buildRemintLineItems", () => {
  it("includes shipping line when shipping total is positive", () => {
    const items = buildRemintLineItems(
      [
        {
          slug: "helmet",
          name: "Helmet",
          price: 50,
          image: "/helmet.jpg",
          quantity: 1,
        },
      ],
      4.99,
    );

    expect(items).toHaveLength(2);
    expect(items[1]).toEqual({
      name: "SHIPPING",
      finalPrice: 4.99,
      quantity: 1,
    });
  });
});
