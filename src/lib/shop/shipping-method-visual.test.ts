import { describe, expect, it } from "vitest";
import {
  dedupeShippingRatesByVisual,
  shippingVisualDedupeKey,
} from "@/lib/shop/shipping-method-visual";

describe("shippingVisualDedupeKey", () => {
  it("uses the same key for GLS parcel locker and courier", () => {
    const locker = {
      id: "1",
      methodId: "montonio_parcel_machine_gls",
      label: "GLS parcel locker",
    };
    const courier = {
      id: "2",
      methodId: "montonio_courier_gls",
      label: "GLS courier",
    };

    expect(shippingVisualDedupeKey(locker)).toBe(shippingVisualDedupeKey(courier));
  });

  it("keeps distinct carriers separate", () => {
    const gls = {
      id: "1",
      methodId: "montonio_parcel_machine_gls",
      label: "GLS",
    };
    const dpd = {
      id: "2",
      methodId: "montonio_parcel_machine_dpd",
      label: "DPD",
    };

    expect(shippingVisualDedupeKey(gls)).not.toBe(shippingVisualDedupeKey(dpd));
  });
});

describe("dedupeShippingRatesByVisual", () => {
  it("returns one entry per carrier logo", () => {
    const rates = [
      {
        id: "1",
        methodId: "montonio_parcel_machine_gls",
        label: "GLS parcel locker",
      },
      {
        id: "2",
        methodId: "montonio_courier_gls",
        label: "GLS courier",
      },
      {
        id: "3",
        methodId: "montonio_parcel_machine_dpd",
        label: "DPD parcel locker",
      },
    ];

    expect(dedupeShippingRatesByVisual(rates)).toHaveLength(2);
  });
});
