import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  MONTONIO_PAYMENT_METHOD_ID,
  type PaymentGateway,
} from "@/lib/graphql/checkout";

const GATEWAY_IDS = {
  bank: MONTONIO_PAYMENT_METHOD_ID,
  card: "wc_montonio_card",
  mobilePay: "wc_montonio_mobilepay",
  bnpl: "wc_montonio_bnpl",
  hirePurchase: "wc_montonio_hire_purchase",
  blik: "wc_montonio_blik",
} as const;

export function getLocalizedMontonioGatewayDefs(locale: Locale) {
  const dict = getDictionary(locale).checkout;

  return [
    {
      id: GATEWAY_IDS.bank,
      title: dict.paymentMethodsBank,
      description: dict.paymentMethodsBankDesc,
    },
    {
      id: GATEWAY_IDS.card,
      title: dict.paymentMethodsCard,
      description: dict.paymentMethodsCardDesc,
    },
    {
      id: GATEWAY_IDS.mobilePay,
      title: dict.paymentMethodsMobilePay,
      description: dict.paymentMethodsMobilePayDesc,
    },
    {
      id: GATEWAY_IDS.bnpl,
      title: dict.paymentMethodsBnpl,
      description: dict.paymentMethodsBnplDesc,
    },
    {
      id: GATEWAY_IDS.hirePurchase,
      title: dict.paymentMethodsHirePurchase,
      description: dict.paymentMethodsHirePurchaseDesc,
    },
    {
      id: GATEWAY_IDS.blik,
      title: dict.paymentMethodsBlik,
      description: dict.paymentMethodsBlikDesc,
    },
  ];
}

export function localizePaymentGateway(
  gateway: PaymentGateway,
  locale: Locale,
): PaymentGateway {
  const dict = getDictionary(locale).checkout;
  const fallbackTitle = gateway.title?.trim() || gateway.id;
  const byId: Record<string, { title: string; description: string }> = {
    [GATEWAY_IDS.bank]: {
      title: dict.paymentMethodsBank,
      description: dict.paymentMethodsBankDesc,
    },
    [GATEWAY_IDS.card]: {
      title: dict.paymentMethodsCard,
      description: dict.paymentMethodsCardDesc,
    },
    [GATEWAY_IDS.mobilePay]: {
      title: dict.paymentMethodsMobilePay,
      description: dict.paymentMethodsMobilePayDesc,
    },
    [GATEWAY_IDS.bnpl]: {
      title: dict.paymentMethodsBnpl,
      description: dict.paymentMethodsBnplDesc,
    },
    [GATEWAY_IDS.hirePurchase]: {
      title: dict.paymentMethodsHirePurchase,
      description: dict.paymentMethodsHirePurchaseDesc,
    },
    [GATEWAY_IDS.blik]: {
      title: dict.paymentMethodsBlik,
      description: dict.paymentMethodsBlikDesc,
    },
    "ppcp-gateway": {
      title: dict.paymentMethodsPaypal,
      description: dict.paymentMethodsPaypalDesc,
    },
    woocommerce_payments: {
      title: dict.paymentMethodsWooPayments,
      description: dict.paymentMethodsWooPaymentsDesc,
    },
  };

  const localized = byId[gateway.id];
  if (localized) {
    return {
      ...gateway,
      title: localized.title,
      description: localized.description,
    };
  }

  return {
    ...gateway,
    title: fallbackTitle,
  };
}

/** Shorten Montonio bank names for ET display where API returns English labels. */
export function localizeBankDisplayName(name: string, locale: Locale) {
  if (locale !== "et") {
    return name
      .replace(/\s+Estonia$/i, "")
      .replace(/\s+Eesti$/i, "")
      .replace(/\s+Bank$/i, "")
      .trim();
  }

  const normalized = name
    .replace(/\s+Estonia$/i, "")
    .replace(/\s+Eesti$/i, "")
    .replace(/\s+Bank$/i, "")
    .trim();

  const etNames: Record<string, string> = {
    "Coop Pank": "Coop Pank",
    "LHV Estonia": "LHV",
    "Luminor Estonia": "Luminor",
    "N26 Estonia": "N26",
    "Revolut Estonia": "Revolut",
    "Citadele Estonia": "Citadele",
    "SEB Estonia": "SEB",
    "Swedbank Estonia": "Swedbank",
  };

  return etNames[normalized] ?? normalized;
}
