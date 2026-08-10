import { describe, expect, it } from "vitest";
import {
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
});
