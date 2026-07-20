import { describe, expect, it } from "vitest";
import { isShippingByAgreement } from "@/lib/shop/shipping-method";

describe("isShippingByAgreement", () => {
  it("detects EN and ET labels", () => {
    expect(
      isShippingByAgreement({
        methodId: "flat_rate",
        label: "Transport by Agreement",
      }),
    ).toBe(true);

    expect(
      isShippingByAgreement({
        methodId: "flat_rate",
        label: "Transport kokkuleppel",
      }),
    ).toBe(true);
  });

  it("does not mark free pickup as by agreement", () => {
    expect(
      isShippingByAgreement({
        methodId: "local_pickup",
        label: "Local pickup",
      }),
    ).toBe(false);
  });
});
