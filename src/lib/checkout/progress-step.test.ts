import { describe, expect, it } from "vitest";
import { deriveCheckoutProgressStep } from "@/lib/checkout/progress-step";

describe("deriveCheckoutProgressStep", () => {
  it("returns step 1 for an empty cart", () => {
    expect(
      deriveCheckoutProgressStep({
        itemCount: 0,
        deliveryReady: true,
      }),
    ).toBe(1);
  });

  it("returns step 2 when the cart has items but delivery is incomplete", () => {
    expect(
      deriveCheckoutProgressStep({
        itemCount: 2,
        deliveryReady: false,
      }),
    ).toBe(2);
  });

  it("returns step 3 when delivery is complete", () => {
    expect(
      deriveCheckoutProgressStep({
        itemCount: 2,
        deliveryReady: true,
      }),
    ).toBe(3);
  });
});
