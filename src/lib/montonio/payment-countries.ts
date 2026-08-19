/** ISO 3166-1 alpha-2 — countries where regional Montonio methods are offered. */
export const MONTONIO_PAYMENT_COUNTRY_CODES = [
  "EE",
  "LV",
  "LT",
  "PL",
  "FI",
] as const;

export type MontonioPaymentCountryCode =
  (typeof MONTONIO_PAYMENT_COUNTRY_CODES)[number];

const MONTONIO_PAYMENT_COUNTRY_SET = new Set<string>(
  MONTONIO_PAYMENT_COUNTRY_CODES,
);

export function isMontonioPaymentCountry(
  country: string | null | undefined,
): boolean {
  if (!country) {
    return false;
  }

  return MONTONIO_PAYMENT_COUNTRY_SET.has(country.toUpperCase());
}
