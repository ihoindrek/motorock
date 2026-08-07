/** Round to the nearest 5 cents so the price ends in 0 or 5 (e.g. 243,97 → 243,95). */
export function roundRetailPrice(price: number) {
  if (!Number.isFinite(price) || price <= 0) {
    return 0;
  }

  return Number((Math.round(price * 20) / 20).toFixed(2));
}

/** WooGraphQL returns prices like `11900,00&nbsp;€`. */
export function parseGraphqlPrice(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const normalized = value
    .replace(/&nbsp;/g, " ")
    .replace(/[^\d,.-]/g, "")
    .replace(",", ".");

  const parsed = Number.parseFloat(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return roundRetailPrice(parsed);
}
