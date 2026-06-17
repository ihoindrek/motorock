export type FinancingProductType = "motorcycle" | "equipment";

export type FinancingProviderId = "montonio" | "inbank" | "esto";

export type FinancingProvider = {
  id: FinancingProviderId;
  name: string;
  tagline: string;
  /** Indicative annual interest (0–1). Shown at checkout; rates may vary. */
  interestRates: Partial<Record<number, number>>;
  terms: readonly number[];
  defaultTerm: number;
  minAmount: number;
  maxAmount: number;
  productTypes: readonly FinancingProductType[];
  /** Shown at checkout via Montonio when true */
  availableAtCheckout: boolean;
};

/**
 * Indicative terms for UI calculator. Final offer is confirmed by the provider at checkout.
 * Montonio Pay Later / järelmaks is the live checkout path on motorock.eu.
 */
export const FINANCING_PROVIDERS: readonly FinancingProvider[] = [
  {
    id: "montonio",
    name: "Montonio",
    tagline: "Pay later & järelmaks at checkout",
    interestRates: {
      3: 0,
      6: 0.059,
      12: 0.089,
      24: 0.099,
      36: 0.109,
      48: 0.119,
    },
    terms: [3, 6, 12, 24, 36, 48],
    defaultTerm: 12,
    minAmount: 75,
    maxAmount: 15_000,
    productTypes: ["equipment", "motorcycle"],
    availableAtCheckout: true,
  },
  {
    id: "inbank",
    name: "Inbank",
    tagline: "Hire purchase",
    interestRates: {
      12: 0.099,
      24: 0.109,
      36: 0.119,
      48: 0.129,
      60: 0.139,
    },
    terms: [12, 24, 36, 48, 60],
    defaultTerm: 48,
    minAmount: 200,
    maxAmount: 15_000,
    productTypes: ["equipment"],
    availableAtCheckout: false,
  },
  {
    id: "esto",
    name: "Esto",
    tagline: "Installments",
    interestRates: {
      12: 0.095,
      24: 0.105,
      36: 0.115,
      48: 0.125,
      60: 0.135,
    },
    terms: [12, 24, 36, 48, 60],
    defaultTerm: 48,
    minAmount: 200,
    maxAmount: 12_000,
    productTypes: ["equipment"],
    availableAtCheckout: false,
  },
] as const;

export const FINANCING_DISCLAIMER =
  "Indicative monthly payment. Final terms, interest, and eligibility are confirmed by the provider at checkout or when you apply.";
