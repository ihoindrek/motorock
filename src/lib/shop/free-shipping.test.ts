import { describe, expect, it } from "vitest";
import {
  freeShippingProgressPercent,
  freeShippingRemainingAmount,
  qualifiesForFreeShipping,
} from "@/lib/shop/free-shipping";

describe("free-shipping helpers", () => {
  it("qualifies at and above threshold", () => {
    expect(qualifiesForFreeShipping(199.99)).toBe(false);
    expect(qualifiesForFreeShipping(200)).toBe(true);
    expect(qualifiesForFreeShipping(250)).toBe(true);
  });

  it("computes remaining amount", () => {
    expect(freeShippingRemainingAmount(150)).toBe(50);
    expect(freeShippingRemainingAmount(200)).toBe(0);
    expect(freeShippingRemainingAmount(220)).toBe(0);
  });

  it("caps progress at 100%", () => {
    expect(freeShippingProgressPercent(100)).toBe(50);
    expect(freeShippingProgressPercent(200)).toBe(100);
    expect(freeShippingProgressPercent(300)).toBe(100);
  });
});
