import {
  FINANCING_PROVIDERS,
  type FinancingProductType,
  type FinancingProvider,
  type FinancingProviderId,
} from "@/data/financing";

export type FinancingQuote = {
  provider: FinancingProvider;
  termMonths: number;
  monthlyPayment: number;
  totalPayable: number;
  interestAmount: number;
  annualInterestRate: number;
};

function getInterestRate(provider: FinancingProvider, termMonths: number): number {
  if (provider.interestRates[termMonths] !== undefined) {
    return provider.interestRates[termMonths]!;
  }

  const knownTerms = provider.terms.filter(
    (term) => provider.interestRates[term] !== undefined,
  );
  const fallbackTerm = knownTerms[knownTerms.length - 1] ?? provider.defaultTerm;
  return provider.interestRates[fallbackTerm] ?? 0.099;
}

export function calculateMonthlyPayment(
  principal: number,
  termMonths: number,
  annualInterestRate: number,
): { monthlyPayment: number; totalPayable: number; interestAmount: number } {
  if (principal <= 0 || termMonths <= 0) {
    return { monthlyPayment: 0, totalPayable: 0, interestAmount: 0 };
  }

  if (annualInterestRate <= 0) {
    const monthlyPayment = principal / termMonths;
    return {
      monthlyPayment,
      totalPayable: principal,
      interestAmount: 0,
    };
  }

  const monthlyRate = annualInterestRate / 12;
  const factor = (1 + monthlyRate) ** termMonths;
  const monthlyPayment =
    (principal * monthlyRate * factor) / (factor - 1);
  const totalPayable = monthlyPayment * termMonths;
  const interestAmount = totalPayable - principal;

  return { monthlyPayment, totalPayable, interestAmount };
}

export function getEligibleProviders(
  price: number,
  productType: FinancingProductType,
): FinancingProvider[] {
  return FINANCING_PROVIDERS.filter(
    (provider) =>
      provider.productTypes.includes(productType) &&
      price >= provider.minAmount &&
      price <= provider.maxAmount,
  );
}

export function getFinancingQuote(
  price: number,
  provider: FinancingProvider,
  termMonths: number,
): FinancingQuote | null {
  if (price < provider.minAmount || price > provider.maxAmount) {
    return null;
  }

  if (!provider.terms.includes(termMonths)) {
    return null;
  }

  const annualInterestRate = getInterestRate(provider, termMonths);
  const { monthlyPayment, totalPayable, interestAmount } = calculateMonthlyPayment(
    price,
    termMonths,
    annualInterestRate,
  );

  return {
    provider,
    termMonths,
    monthlyPayment,
    totalPayable,
    interestAmount,
    annualInterestRate,
  };
}

export function getAllFinancingQuotes(
  price: number,
  productType: FinancingProductType,
): FinancingQuote[] {
  const quotes: FinancingQuote[] = [];

  for (const provider of getEligibleProviders(price, productType)) {
    for (const termMonths of provider.terms) {
      const quote = getFinancingQuote(price, provider, termMonths);
      if (quote) {
        quotes.push(quote);
      }
    }
  }

  return quotes.sort((a, b) => a.monthlyPayment - b.monthlyPayment);
}

export function getLowestFinancingQuote(
  price: number,
  productType: FinancingProductType,
): FinancingQuote | null {
  return getAllFinancingQuotes(price, productType)[0] ?? null;
}

export function getDefaultFinancingSelection(
  price: number,
  productType: FinancingProductType,
): { providerId: FinancingProviderId; termMonths: number } | null {
  const providers = getEligibleProviders(price, productType);
  const montonio = providers.find((provider) => provider.id === "montonio");
  const provider = montonio ?? providers[0];

  if (!provider) {
    return null;
  }

  const preferredTerm =
    productType === "motorcycle"
      ? provider.terms.includes(48)
        ? 48
        : provider.defaultTerm
      : provider.defaultTerm;

  return {
    providerId: provider.id,
    termMonths: provider.terms.includes(preferredTerm)
      ? preferredTerm
      : provider.defaultTerm,
  };
}

export function formatMonthlyPrice(amount: number) {
  return new Intl.NumberFormat("et-EE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Math.ceil(amount));
}

export function formatInterestRate(rate: number) {
  return new Intl.NumberFormat("et-EE", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(rate);
}
