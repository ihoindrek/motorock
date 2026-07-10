import type { Locale } from "@/i18n/config";

/** Inbank calculator widget — same integration as Montonio for WooCommerce. */
export const INBANK_CALCULATOR_SCRIPT_ID = "inbank-calculator-script";
export const INBANK_CALCULATOR_SCRIPT_URL =
  "https://calculator.inbank.eu/api/calculator";

/** Defaults from montonio-for-woocommerce `WC_Montonio_Inbank_Calculator`. */
export const INBANK_CALCULATOR_DEFAULTS = {
  region: "ee",
  shopUuid: "9a6bebb3-ade9-4968-800c-95ac1f3adecc",
  productCode: "hp_epos_montonio_119",
  minAmount: 100,
  maxAmount: 10_000,
  template: "no_editable_amount",
  mode: "lavender",
} as const;

export type InbankCalculatorMode = "lavender" | "purple" | "white";
export type InbankCalculatorTemplate =
  "no_editable_amount" | "editable_amount";

/** Inbank default layout — 300px container renders 300×125 hire purchase widget. */
export const INBANK_CALCULATOR_COMPACT_WIDTH_PX = 300;
export const INBANK_CALCULATOR_COMPACT_HEIGHT_PX = 125;

/** Official Inbank logo used by CalculatorWidget (white mode, black variant). */
export const INBANK_LOGO_URL =
  "https://calculator.inbank.eu/images/logo/black/inbank_logo/Inbank.svg";

export const INBANK_CALCULATOR_DEFAULT_MONTHLY_PAYMENT_EUR = 100;

export function formatInbankDefaultMonthlyPayment(
  locale: Locale,
  perMonthSuffix: string,
) {
  const formatted = new Intl.NumberFormat(locale === "et" ? "et-EE" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(INBANK_CALCULATOR_DEFAULT_MONTHLY_PAYMENT_EUR);

  return `${formatted}${perMonthSuffix}`;
}

export function formatInbankMonthlyPaymentText(
  paymentText: string,
  perMonthSuffix: string,
) {
  return paymentText.includes("/")
    ? paymentText
    : `${paymentText}${perMonthSuffix}`;
}

export function parseInbankPaymentEuroAmount(text: string): number | null {
  const match = text.match(/(\d[\d\s.,]*)\s*€|€\s*(\d[\d\s.,]*)/);
  const raw = match?.[1] ?? match?.[2];
  if (!raw) {
    return null;
  }

  const value = Number(raw.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

export function isValidInbankMonthlyPaymentText(text: string): boolean {
  const amount = parseInbankPaymentEuroAmount(text);
  return amount !== null && amount > 0;
}

export function resolveInbankMonthlyPaymentLine(
  paymentText: string | undefined,
  locale: Locale,
  perMonthSuffix: string,
) {
  if (paymentText && isValidInbankMonthlyPaymentText(paymentText)) {
    return formatInbankMonthlyPaymentText(paymentText, perMonthSuffix);
  }

  return formatInbankDefaultMonthlyPayment(locale, perMonthSuffix);
}

export type InbankCalculatorInitOptions = {
  layout: "default";
  variant: "calculator-indivy-plan";
  shop_uuid: string;
  product_code: string;
  amount: number;
  template: InbankCalculatorTemplate;
  mode: InbankCalculatorMode;
  lang: "et" | "en";
  region: string;
};

export type InbankCalculatorWidget = {
  init: (containerId: string, options: InbankCalculatorInitOptions) => void;
};

declare global {
  interface Window {
    CalculatorWidget?: InbankCalculatorWidget;
  }
}

let scriptLoadPromise: Promise<InbankCalculatorWidget> | null = null;

export function getInbankCalculatorConfig() {
  const enabled = process.env.NEXT_PUBLIC_INBANK_CALCULATOR_ENABLED !== "false";

  return {
    enabled,
    shopUuid:
      process.env.NEXT_PUBLIC_INBANK_CALCULATOR_SHOP_UUID?.trim() ||
      INBANK_CALCULATOR_DEFAULTS.shopUuid,
    productCode:
      process.env.NEXT_PUBLIC_INBANK_CALCULATOR_PRODUCT_CODE?.trim() ||
      INBANK_CALCULATOR_DEFAULTS.productCode,
    minAmount: INBANK_CALCULATOR_DEFAULTS.minAmount,
    maxAmount: INBANK_CALCULATOR_DEFAULTS.maxAmount,
    template:
      (process.env.NEXT_PUBLIC_INBANK_CALCULATOR_TEMPLATE as
        | InbankCalculatorTemplate
        | undefined) ?? INBANK_CALCULATOR_DEFAULTS.template,
    mode:
      (process.env.NEXT_PUBLIC_INBANK_CALCULATOR_MODE as
        | InbankCalculatorMode
        | undefined) ?? INBANK_CALCULATOR_DEFAULTS.mode,
    region: INBANK_CALCULATOR_DEFAULTS.region,
  };
}

export function isInbankCalculatorAmount(amount: number) {
  const { minAmount, maxAmount } = getInbankCalculatorConfig();
  return amount >= minAmount && amount <= maxAmount;
}

export function loadInbankCalculatorWidget(): Promise<InbankCalculatorWidget> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("CalculatorWidget requires a browser"));
  }

  if (window.CalculatorWidget?.init) {
    return Promise.resolve(window.CalculatorWidget);
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(INBANK_CALCULATOR_SCRIPT_ID);
    if (existing) {
      const poll = window.setInterval(() => {
        if (window.CalculatorWidget?.init) {
          window.clearInterval(poll);
          resolve(window.CalculatorWidget);
        }
      }, 100);
      window.setTimeout(() => {
        window.clearInterval(poll);
        reject(new Error("Inbank calculator script timed out"));
      }, 15_000);
      return;
    }

    const script = document.createElement("script");
    script.id = INBANK_CALCULATOR_SCRIPT_ID;
    script.src = INBANK_CALCULATOR_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (window.CalculatorWidget?.init) {
        resolve(window.CalculatorWidget);
        return;
      }

      reject(new Error("CalculatorWidget.init missing"));
    };
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error("Inbank calculator script failed to load"));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export function inbankCalculatorLang(locale: Locale): "et" | "en" {
  return locale === "et" ? "et" : "en";
}

function findInbankCalculatorTrigger(root: HTMLElement): HTMLElement | null {
  const selectors = [
    "button:not([disabled])",
    "a[href]",
    '[role="button"]',
  ];

  for (const selector of selectors) {
    const match = root.querySelector(selector);
    if (match instanceof HTMLElement) {
      return match;
    }
  }

  return null;
}

/** Click the hidden Inbank widget to open Montonio/Inbank's official modal. */
export function openInbankCalculatorModal(root: HTMLElement) {
  findInbankCalculatorTrigger(root)?.click();
}

export function waitForInbankCalculatorTrigger(
  root: HTMLElement,
  timeoutMs = 8000,
): Promise<HTMLElement | null> {
  const existing = findInbankCalculatorTrigger(root);
  if (existing) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const trigger = findInbankCalculatorTrigger(root);
      if (trigger) {
        observer.disconnect();
        resolve(trigger);
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    window.setTimeout(() => {
      observer.disconnect();
      resolve(findInbankCalculatorTrigger(root));
    }, timeoutMs);
  });
}

export type InbankCalculatorPreview = {
  logoUrl?: string;
  paymentText?: string;
};

function normalizePaymentCandidate(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function isPeriodCandidate(text: string) {
  const normalized = text.toLowerCase();
  return (
    /\b\d+\s*(kuud?|months?|mo)\b/.test(normalized) ||
    /\b(kuud?|months?)\b/.test(normalized) && !normalized.includes("/")
  );
}

function normalizeMonthlyPaymentText(text: string) {
  const normalized = normalizePaymentCandidate(text);
  const withoutPeriod = normalized
    .replace(/\s*[·•|/]\s*\d+\s*(kuud?|months?|mo)\b.*$/i, "")
    .replace(/\s*\(\d+\s*(kuud?|months?|mo)\)\s*$/i, "")
    .trim();

  return withoutPeriod || normalized;
}

/** Read logo and monthly payment from the hidden Inbank widget DOM. */
export function parseInbankCalculatorPreview(
  root: HTMLElement,
  productAmount: number,
): InbankCalculatorPreview {
  const logoUrl = root.querySelector("img")?.getAttribute("src") ?? undefined;
  const productDigits = String(Math.round(productAmount));

  const candidates: string[] = [];
  for (const element of root.querySelectorAll("*")) {
    if (element.children.length > 0) {
      continue;
    }

    const text = normalizePaymentCandidate(element.textContent ?? "");
    if (
      !text.includes("€") ||
      text.length > 32 ||
      isPeriodCandidate(text) ||
      !isValidInbankMonthlyPaymentText(text)
    ) {
      continue;
    }

    candidates.push(text);
  }

  const paymentText =
    candidates.find((text) => text.includes("/")) ??
    candidates.find((text) => {
      const digits = text.replace(/\D/g, "");
      return digits.length > 0 && !digits.startsWith(productDigits);
    }) ??
    candidates.find((text) => text.includes("€")) ??
    undefined;

  const normalizedPaymentText = paymentText
    ? normalizeMonthlyPaymentText(paymentText)
    : undefined;

  return {
    logoUrl,
    paymentText:
      normalizedPaymentText &&
      isValidInbankMonthlyPaymentText(normalizedPaymentText)
        ? normalizedPaymentText
        : undefined,
  };
}

export async function waitForInbankCalculatorPreview(
  root: HTMLElement,
  productAmount: number,
  timeoutMs = 8000,
): Promise<InbankCalculatorPreview | null> {
  await waitForInbankCalculatorTrigger(root, timeoutMs);

  const preview = parseInbankCalculatorPreview(root, productAmount);
  if (preview.logoUrl || preview.paymentText) {
    return preview;
  }

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const next = parseInbankCalculatorPreview(root, productAmount);
      if (next.logoUrl || next.paymentText) {
        observer.disconnect();
        resolve(next);
      }
    });

    observer.observe(root, { childList: true, subtree: true, characterData: true });

    window.setTimeout(() => {
      observer.disconnect();
      resolve(parseInbankCalculatorPreview(root, productAmount));
    }, timeoutMs);
  });
}
