import { describe, expect, it } from "vitest";
import { isCheckoutPaymentFailure } from "@/lib/graphql/checkout";

describe("isCheckoutPaymentFailure", () => {
  it("treats WooPayments fail result as a payment failure", () => {
    expect(isCheckoutPaymentFailure("fail")).toBe(true);
    expect(isCheckoutPaymentFailure("failure")).toBe(true);
    expect(isCheckoutPaymentFailure("success")).toBe(false);
  });
});
