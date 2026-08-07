import type { Dictionary } from "@/i18n/dictionaries/en";
import { MONTONIO_PAYMENT_METHOD_ID } from "@/lib/graphql/checkout";
import { INBANK_LOGO_URL } from "@/lib/montonio/inbank-calculator";

export type PaymentTrustBadge =
  | {
      id: string;
      kind: "gateway";
      gatewayId: string;
      title: string;
    }
  | {
      id: string;
      kind: "logo";
      src: string;
      title: string;
    }
  | {
      id: string;
      kind: "label";
      label: string;
      title: string;
    };

function regionForCountry(country: string | null | undefined) {
  const iso = country?.toUpperCase() ?? "EE";

  if (iso === "EE") {
    return "estonia" as const;
  }

  if (iso === "LV" || iso === "LT") {
    return "latvia-lithuania" as const;
  }

  if (iso === "FI") {
    return "finland" as const;
  }

  if (iso === "PL") {
    return "poland" as const;
  }

  return "other-eu" as const;
}

/** Static trust badges for PDP — aligned with checkout payment regions. */
export function resolvePaymentTrustBadges(
  country: string | null | undefined,
  dict: Dictionary,
): PaymentTrustBadge[] {
  const checkout = dict.checkout;
  const pdp = dict.pdp;
  const region = regionForCountry(country);

  const bank = {
    id: "bank",
    kind: "gateway" as const,
    gatewayId: MONTONIO_PAYMENT_METHOD_ID,
    title: checkout.paymentMethodsBank,
  };

  const card = {
    id: "card",
    kind: "label" as const,
    label: pdp.paymentTrustCard,
    title: checkout.paymentMethodsCard,
  };

  const paypal = {
    id: "paypal",
    kind: "gateway" as const,
    gatewayId: "ppcp-gateway",
    title: checkout.paymentMethodsPaypal,
  };

  if (region === "estonia") {
    return [
      bank,
      card,
      paypal,
      {
        id: "hire-purchase",
        kind: "logo",
        src: INBANK_LOGO_URL,
        title: checkout.paymentMethodsHirePurchase,
      },
      {
        id: "bnpl",
        kind: "gateway",
        gatewayId: "wc_montonio_bnpl",
        title: checkout.paymentMethodsBnpl,
      },
    ];
  }

  if (region === "latvia-lithuania") {
    return [
      bank,
      card,
      {
        id: "bnpl",
        kind: "gateway",
        gatewayId: "wc_montonio_bnpl",
        title: checkout.paymentMethodsBnpl,
      },
      paypal,
    ];
  }

  if (region === "finland") {
    return [
      bank,
      card,
      {
        id: "mobilepay",
        kind: "gateway",
        gatewayId: "wc_montonio_mobilepay",
        title: checkout.paymentMethodsMobilePay,
      },
      paypal,
    ];
  }

  if (region === "poland") {
    return [
      bank,
      card,
      {
        id: "blik",
        kind: "gateway",
        gatewayId: "wc_montonio_blik",
        title: checkout.paymentMethodsBlik,
      },
      paypal,
    ];
  }

  return [bank, card, paypal];
}
