import type { CheckoutStep } from "@/context/checkout-step-context";

export function deriveCheckoutProgressStep(input: {
  itemCount: number;
  mobileStep: CheckoutStep;
  deliveryReady: boolean;
  isDesktopLayout: boolean;
}): CheckoutStep {
  if (input.itemCount === 0) {
    return 1;
  }

  if (input.isDesktopLayout) {
    return input.deliveryReady ? 3 : 2;
  }

  return input.mobileStep;
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
