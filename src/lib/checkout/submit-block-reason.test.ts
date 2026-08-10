import { describe, expect, it } from "vitest";
import { resolveSubmitBlockReason } from "@/lib/checkout/submit-block-reason";

const messages = {
  terms: "Accept terms",
  delivery: "Complete delivery",
  payment: "Choose payment",
  montonioBank: "Choose bank",
  pickupInvalid: "Invalid pickup",
};

const readyInput = {
  termsAccepted: true,
  deliveryReady: true,
  paymentSelected: true,
  paymentLoading: false,
  paymentError: null,
  needsMontonioProvider: false,
  montonioOptionSelected: false,
  pickupValid: true,
  messages,
};

describe("resolveSubmitBlockReason", () => {
  it("prioritises terms before other blockers", () => {
    expect(
      resolveSubmitBlockReason({
        ...readyInput,
        termsAccepted: false,
        deliveryReady: false,
        paymentSelected: false,
      }),
    ).toBe("Accept terms");
  });

  it("blocks when montonio bank is required but missing", () => {
    expect(
      resolveSubmitBlockReason({
        ...readyInput,
        needsMontonioProvider: true,
        montonioOptionSelected: false,
      }),
    ).toBe("Choose bank");
  });

  it("returns null when checkout can submit", () => {
    expect(resolveSubmitBlockReason(readyInput)).toBeNull();
  });
});
