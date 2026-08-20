export const FINANCING_COUNTRY_CODE = "EE";

/** ISO countries where Inbank hire purchase / PDP calculator is offered. */
export const FINANCING_AVAILABLE_COUNTRIES = new Set<string>([
  FINANCING_COUNTRY_CODE,
]);

export type FinancingPdpProductKind = "motorcycle" | "equipment";

export function isFinancingAvailable(country: string | null | undefined) {
  if (!country) {
    return false;
  }

  return FINANCING_AVAILABLE_COUNTRIES.has(country.toUpperCase());
}

/** Inbank calculator on PDP — motorcycles only for now. */
export function isFinancingPdpEnabled(productKind: FinancingPdpProductKind) {
  return productKind === "motorcycle";
}
