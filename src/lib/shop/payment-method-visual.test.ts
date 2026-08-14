import { describe, expect, it } from "vitest";
import { resolvePaymentMethodVisual } from "@/lib/shop/payment-method-visual";

describe("resolvePaymentMethodVisual", () => {
  it("uses the wide card payments logo for Montonio card gateway", () => {
    const visual = resolvePaymentMethodVisual(
      "wc_montonio_card",
      "Card payment",
      null,
    );

    expect(visual).toEqual({
      kind: "logo",
      src: "https://public.montonio.com/images/logos/visa-mc-ap-gp.png",
      alt: "Card payment",
      layout: "card",
    });
  });

  it("keeps the Montonio mark for other Montonio gateways", () => {
    const visual = resolvePaymentMethodVisual(
      "wc_montonio_payments",
      "Pay with your bank",
      null,
    );

    expect(visual.kind).toBe("logo");
    if (visual.kind === "logo") {
      expect(visual.src).toContain("montonio-logo-mark.svg");
      expect(visual.layout).toBeUndefined();
    }
  });
});
