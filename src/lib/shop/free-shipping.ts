import { FREE_SHIPPING_THRESHOLD_EUR } from "@/data/storefront-policies";

export function qualifiesForFreeShipping(subtotal: number): boolean {
  return subtotal >= FREE_SHIPPING_THRESHOLD_EUR;
}

export function freeShippingRemainingAmount(subtotal: number): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD_EUR - subtotal);
}

export function freeShippingProgressPercent(subtotal: number): number {
  if (FREE_SHIPPING_THRESHOLD_EUR <= 0) {
    return 100;
  }

  return Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD_EUR) * 100);
}
