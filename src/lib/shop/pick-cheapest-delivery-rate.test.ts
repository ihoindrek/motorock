import { describe, expect, it } from "vitest";
import { pickCheapestDeliveryRate } from "@/lib/shop/pick-cheapest-delivery-rate";
import type { ShippingRate } from "@/lib/shop/shipping-method";

function rate(
  partial: Partial<ShippingRate> & Pick<ShippingRate, "id" | "label" | "methodId">,
): ShippingRate {
  return {
    cost: null,
    instanceId: null,
    ...partial,
  };
}

describe("pickCheapestDeliveryRate", () => {
  it("excludes showroom pickup and picks cheapest parcel rate", () => {
    const pick = pickCheapestDeliveryRate([
      rate({
        id: "pickup",
        label: "Local pickup",
        methodId: "local_pickup",
        cost: "0",
      }),
      rate({
        id: "omniva",
        label: "Omniva parcel machine",
        methodId: "montonio_parcel_machine",
        cost: "3.50",
      }),
      rate({
        id: "courier",
        label: "Courier",
        methodId: "montonio_courier",
        cost: "7.90",
      }),
    ]);

    expect(pick).toEqual({
      kind: "priced",
      cost: 3.5,
      rate: expect.objectContaining({ id: "omniva" }),
    });
  });

  it("returns free when cheapest delivery is zero", () => {
    const pick = pickCheapestDeliveryRate([
      rate({
        id: "free",
        label: "Free shipping",
        methodId: "free_shipping",
        cost: "0",
      }),
    ]);

    expect(pick?.kind).toBe("free");
  });

  it("falls back to by-agreement when no priced rates", () => {
    const pick = pickCheapestDeliveryRate([
      rate({
        id: "agree",
        label: "Transport by Agreement",
        methodId: "flat_rate",
        cost: "0",
      }),
    ]);

    expect(pick?.kind).toBe("byAgreement");
  });
});
