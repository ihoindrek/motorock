export const SHIPPING_THRESHOLD = 150;
export const SHIPPING_COST = 5.9;

export function getCartTotals(subtotal: number) {
  const shipping =
    subtotal >= SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_COST;

  return {
    shipping,
    total: subtotal + shipping,
  };
}
