import { createMontonioShippingJwt } from "@/lib/montonio/shipping-auth";
import { getMontonioConfig } from "@/lib/montonio/config";
import type {
  MontonioPaymentOption,
  MontonioPaymentOptionKind,
} from "@/types/montonio-payment";

const cache = new Map<string, { fetchedAt: number; options: MontonioPaymentOption[] }>();
const CACHE_MS = 1000 * 60 * 30;

type BankLike = {
  code?: string;
  name?: string;
  logoUrl?: string;
  uiPosition?: number;
};

function kindForSystemName(systemName: string): MontonioPaymentOptionKind {
  switch (systemName) {
    case "cardPayments":
      return "card";
    case "bnpl":
      return "bnpl";
    case "hirePurchase":
      return "hirePurchase";
    case "blik":
      return "blik";
    default:
      return "bank";
  }
}

function labelForSystemName(systemName: string) {
  switch (systemName) {
    case "cardPayments":
      return "Card payment";
    case "bnpl":
      return "Buy now, pay later";
    case "hirePurchase":
      return "Hire purchase";
    case "blik":
      return "BLIK";
    default:
      return systemName;
  }
}

function sortOptions(options: MontonioPaymentOption[]) {
  return [...options].sort((left, right) => {
    if (left.kind !== right.kind) {
      const order: MontonioPaymentOptionKind[] = [
        "bank",
        "card",
        "bnpl",
        "hirePurchase",
        "blik",
      ];
      return order.indexOf(left.kind) - order.indexOf(right.kind);
    }

    return left.name.localeCompare(right.name, "en");
  });
}

function dedupeOptions(options: MontonioPaymentOption[]) {
  const seen = new Set<string>();

  return options.filter((option) => {
    const key = `${option.kind}:${option.code}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function pushBankOptions(
  target: MontonioPaymentOption[],
  banks: BankLike[],
  systemName: string,
) {
  for (const bank of banks) {
    if (!bank.code && !bank.name) {
      continue;
    }

    target.push({
      code: bank.code ?? bank.name ?? "",
      name: bank.name ?? bank.code ?? "",
      logoUrl: bank.logoUrl ?? null,
      systemName,
      kind: "bank",
    });
  }
}

export function parseMontonioPaymentMethods(
  payload: unknown,
  country: string,
): MontonioPaymentOption[] {
  const iso = country.toUpperCase();
  const root = payload as { paymentMethods?: unknown };
  const raw = root.paymentMethods;
  const options: MontonioPaymentOption[] = [];

  if (!raw) {
    return options;
  }

  if (Array.isArray(raw)) {
    for (const entry of raw) {
      const record = entry as Record<string, unknown>;
      const systemName = String(record.systemName ?? "");
      const banks = record.banks as Array<BankLike & { country?: string }> | undefined;

      if (systemName === "paymentInitiation" && Array.isArray(banks)) {
        pushBankOptions(
          options,
          banks.filter(
            (bank) => !bank.country || bank.country.toUpperCase() === iso,
          ),
          systemName,
        );
        continue;
      }

      if (
        systemName &&
        systemName !== "paymentInitiation" &&
        kindForSystemName(systemName) !== "bank"
      ) {
        options.push({
          code: systemName,
          name: labelForSystemName(systemName),
          logoUrl: typeof record.logoUrl === "string" ? record.logoUrl : null,
          systemName,
          kind: kindForSystemName(systemName),
        });
      }
    }

    return sortOptions(dedupeOptions(options));
  }

  if (typeof raw === "object") {
    for (const [key, detail] of Object.entries(raw)) {
      const record = detail as Record<string, unknown>;
      const systemName = key;

      if (systemName === "paymentInitiation") {
        const setup = record.setup as
          | Record<string, { paymentMethods?: BankLike[] }>
          | undefined;
        const countrySetup = setup?.[iso];

        if (countrySetup?.paymentMethods?.length) {
          pushBankOptions(options, countrySetup.paymentMethods, systemName);
        }
        continue;
      }

      options.push({
        code: systemName,
        name: labelForSystemName(systemName),
        logoUrl: typeof record.logoUrl === "string" ? record.logoUrl : null,
        systemName,
        kind: kindForSystemName(systemName),
      });
    }
  }

  return sortOptions(dedupeOptions(options));
}

export async function fetchMontonioPaymentOptions(country: string) {
  const iso = country.toUpperCase();
  const cached = cache.get(iso);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < CACHE_MS) {
    return cached.options;
  }

  const config = getMontonioConfig();
  if (!config.isConfigured || !config.accessKey || !config.secretKey) {
    return [];
  }

  const token = createMontonioShippingJwt(config.accessKey, config.secretKey);
  const response = await fetch(`${config.paymentsApiBase}/stores/payment-methods`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    next: { revalidate: 60 * 30 },
  });

  if (!response.ok) {
    throw new Error(`Montonio payment methods HTTP ${response.status}`);
  }

  const payload = await response.json();
  const options = parseMontonioPaymentMethods(payload, iso);
  cache.set(iso, { fetchedAt: now, options });
  return options;
}
