import {
  isShippingByAgreement,
  parseShippingRateCost,
  type ShippingRate,
} from "@/lib/shop/shipping-method";

/** Woo cart.shippingTotal can stay 0 while the chosen rate already has a quoted cost. */
export function resolveCheckoutShippingTotal(
  cartShippingTotal: number,
  selectedRate: ShippingRate | null,
): number {
  if (cartShippingTotal > 0) {
    return cartShippingTotal;
  }

  if (!selectedRate || isShippingByAgreement(selectedRate)) {
    return 0;
  }

  return parseShippingRateCost(selectedRate.cost);
}

export function resolveCheckoutDisplayTotal(input: {
  cartShippingTotal: number;
  selectedRate: ShippingRate | null;
  subtotal: number;
  discountTotal: number;
  wcTotal: number | null;
}): number {
  const shipping = resolveCheckoutShippingTotal(
    input.cartShippingTotal,
    input.selectedRate,
  );
  const computed = input.subtotal + shipping - input.discountTotal;

  if (input.wcTotal == null) {
    return computed;
  }

  if (input.cartShippingTotal > 0 || shipping === 0) {
    return input.wcTotal;
  }

  return Math.max(input.wcTotal, computed);
}
