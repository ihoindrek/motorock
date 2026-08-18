import { describe, expect, it } from "vitest";
import { resolveSelectedShippingRateId } from "@/lib/graphql/checkout";
import type { ShippingRate } from "@/lib/shop/shipping-method";

const rates: ShippingRate[] = [
  {
    id: "montonio_omniva_parcel_machines:6",
    methodId: "montonio_omniva_parcel_machines",
    label: "Omniva",
    cost: "3.99",
    instanceId: "6",
  },
  {
    id: "local_pickup:4",
    methodId: "local_pickup",
    label: "Pickup",
    cost: "0",
    instanceId: "4",
  },
];

describe("resolveSelectedShippingRateId", () => {
  it("keeps an explicit buyer selection when rates refresh", () => {
    expect(
      resolveSelectedShippingRateId(
        "montonio_omniva_parcel_machines:6",
        rates,
      ),
    ).toBe("montonio_omniva_parcel_machines:6");
  });

  it("does not auto-select Woo default shipping on first load", () => {
    expect(resolveSelectedShippingRateId(null, rates)).toBeNull();
  });

  it("clears stale selections that are no longer available", () => {
    expect(
      resolveSelectedShippingRateId("montonio_dpd_parcel_machines:7", rates),
    ).toBeNull();
  });
});
