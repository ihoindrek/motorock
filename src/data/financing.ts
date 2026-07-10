export const FINANCING_COUNTRY_CODE = "EE";

export function isFinancingAvailable(country: string) {
  return country.toUpperCase() === FINANCING_COUNTRY_CODE;
}
