import { describe, expect, it } from "vitest";
import { deriveCheckoutProgressStep } from "@/lib/checkout/progress-step";

describe("deriveCheckoutProgressStep", () => {
  it("returns step 1 for an empty cart", () => {
    expect(
      deriveCheckoutProgressStep({
        itemCount: 0,
        mobileStep: 2,
        deliveryReady: true,
        isDesktopLayout: true,
      }),
    ).toBe(1);
  });

  it("follows mobileStep on narrow viewports", () => {
    expect(
      deriveCheckoutProgressStep({
        itemCount: 2,
        mobileStep: 2,
        deliveryReady: false,
        isDesktopLayout: false,
      }),
    ).toBe(2);
  });

  it("uses delivery completion on desktop instead of mobileStep", () => {
    expect(
      deriveCheckoutProgressStep({
        itemCount: 2,
        mobileStep: 1,
        deliveryReady: false,
        isDesktopLayout: true,
      }),
    ).toBe(2);

    expect(
      deriveCheckoutProgressStep({
        itemCount: 2,
        mobileStep: 1,
        deliveryReady: true,
        isDesktopLayout: true,
      }),
    ).toBe(3);
  });
});
