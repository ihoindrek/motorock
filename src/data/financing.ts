export const FINANCING_COUNTRY_CODE = "EE";

/** ISO countries where Inbank hire purchase / PDP calculator is offered. */
export const FINANCING_AVAILABLE_COUNTRIES = new Set<string>([
  FINANCING_COUNTRY_CODE,
]);

export function isFinancingAvailable(country: string | null | undefined) {
  if (!country) {
    return false;
  }

  return FINANCING_AVAILABLE_COUNTRIES.has(country.toUpperCase());
}
