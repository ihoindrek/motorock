import { describe, expect, it } from "vitest";
import {
  resolveCheckoutDisplaySubtotal,
  resolveCheckoutDisplayTotal,
  resolveCheckoutShippingTotal,
} from "@/lib/checkout/shipping-total";
import type { ShippingRate } from "@/lib/shop/shipping-method";

const paidPickupRate: ShippingRate = {
  id: "montonio:1:omniva",
  label: "Omniva pakiautomaat",
  cost: "2.99",
  methodId: "montonio",
  instanceId: 1,
};

describe("resolveCheckoutShippingTotal", () => {
  it("prefers Woo cart shipping total when present", () => {
    expect(resolveCheckoutShippingTotal(3.5, paidPickupRate)).toBe(3.5);
  });

  it("falls back to selected rate cost when cart shipping is zero", () => {
    expect(resolveCheckoutShippingTotal(0, paidPickupRate)).toBe(2.99);
  });

  it("returns zero for a genuinely free selected rate", () => {
    expect(
      resolveCheckoutShippingTotal(0, {
        ...paidPickupRate,
        cost: "0",
      }),
    ).toBe(0);
  });
});

describe("resolveCheckoutDisplaySubtotal", () => {
  it("prefers Woo subtotal when populated", () => {
    expect(resolveCheckoutDisplaySubtotal(400, 437.32, 3)).toBe(437.32);
  });

  it("falls back to local subtotal when Woo reports zero with items", () => {
    expect(resolveCheckoutDisplaySubtotal(437.35, 0, 3)).toBe(437.35);
  });

  it("uses Woo zero for an empty cart", () => {
    expect(resolveCheckoutDisplaySubtotal(0, 0, 0)).toBe(0);
  });
});

describe("resolveCheckoutDisplayTotal", () => {
  it("adds quoted shipping when Woo total omitted it", () => {
    expect(
      resolveCheckoutDisplayTotal({
        cartShippingTotal: 0,
        selectedRate: paidPickupRate,
        subtotal: 9.9,
        discountTotal: 0,
        wcTotal: 9.9,
      }),
    ).toBeCloseTo(12.89);
  });

  it("keeps Woo total when cart shipping total is populated", () => {
    expect(
      resolveCheckoutDisplayTotal({
        cartShippingTotal: 2.99,
        selectedRate: paidPickupRate,
        subtotal: 9.9,
        discountTotal: 0,
        wcTotal: 12.89,
      }),
    ).toBeCloseTo(12.89);
  });

  it("computes total when Woo reports zero with a non-zero subtotal", () => {
    expect(
      resolveCheckoutDisplayTotal({
        cartShippingTotal: 0,
        selectedRate: null,
        subtotal: 437.35,
        discountTotal: 43.74,
        wcTotal: 0,
      }),
    ).toBeCloseTo(393.61);
  });
});
