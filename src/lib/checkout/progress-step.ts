import type { CheckoutStep } from "@/context/checkout-step-context";

export function deriveCheckoutProgressStep(input: {
  itemCount: number;
  deliveryReady: boolean;
}): CheckoutStep {
  if (input.itemCount === 0) {
    return 1;
  }

  if (input.deliveryReady) {
    return 3;
  }

  return 2;
}

export const CHECKOUT_STEP_SECTION_IDS = {
  1: "checkout-step-cart",
  2: "checkout-step-delivery",
  3: "checkout-step-payment",
} as const satisfies Record<CheckoutStep, string>;

export function scrollToCheckoutStep(step: CheckoutStep) {
  if (typeof document === "undefined") {
    return;
  }

  document
    .getElementById(CHECKOUT_STEP_SECTION_IDS[step])
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}
