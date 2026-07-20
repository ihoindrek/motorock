import { describe, expect, it } from "vitest";
import { localizeShippingRateLabel } from "@/lib/shop/localize-shipping-label";

describe("localizeShippingRateLabel", () => {
  it("keeps English labels for en locale", () => {
    expect(
      localizeShippingRateLabel(
        { id: "1", methodId: "flat_rate", label: "Transport by Agreement" },
        "en",
      ),
    ).toBe("Transport by Agreement");
  });

  it("translates common shipping phrases to Estonian", () => {
    expect(
      localizeShippingRateLabel(
        { id: "1", methodId: "flat_rate", label: "Transport by Agreement" },
        "et",
      ),
    ).toBe("Transport kokkuleppel");

    expect(
      localizeShippingRateLabel(
        {
          id: "montonio_omniva",
          methodId: "montonio_parcel_machine_omniva",
          label: "Omniva parcel machine",
        },
        "et",
      ),
    ).toBe("Omniva pakiautomaat");

    expect(
      localizeShippingRateLabel(
        {
          id: "local",
          methodId: "local_pickup",
          label: "Local pickup",
        },
        "et",
      ),
    ).toBe("Tulen ise järgi");
  });
});
