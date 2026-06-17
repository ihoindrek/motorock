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
  return Number.isFinite(parsed) ? parsed : 0;
}
