import type { MontonioPaymentOption } from "@/types/montonio-payment";
import type { PickupPoint } from "@/types/pickup-point";

export const MONTONIO_PAYMENT_METHOD_ID = "wc_montonio_payments";
export const MONTONIO_CARD_PAYMENT_METHOD_ID = "wc_montonio_card";
/** Woo-only gateway: creates a pending order without calling Montonio (GraphQL checkout). */
export const MOTOROCK_HEADLESS_PENDING_GATEWAY_ID = "motorock_headless_pending";

/** Montonio gateways that must not run Woo process_payment — storefront remint handles payment. */
const MONTONIO_REMINT_SUBMIT_GATEWAY_IDS = new Set([
  MONTONIO_CARD_PAYMENT_METHOD_ID,
  "wc_montonio_mobilepay",
  "wc_montonio_blik",
  "wc_montonio_hire_purchase",
  "wc_montonio_bnpl",
]);

export type CheckoutMetaDataInput = {
  key: string;
  value: string;
};

export function isMontonioPaymentGateway(gatewayId: string | null | undefined) {
  return Boolean(gatewayId?.toLowerCase().includes("montonio"));
}

/**
 * Card/BLIK/etc. need a server-side Montonio order — Woo bank gateway ignores meta.
 * Bank link must NOT remint: Woo checkout already creates the Montonio payment and
 * a second order with the same merchantReference returns "Invalid payment reference".
 */
export function needsMontonioPaymentRemint(
  option: MontonioPaymentOption | null | undefined,
) {
  return Boolean(option && option.kind !== "bank");
}

export function shouldRunMontonioPaymentRemint(
  paymentGatewayId: string | null | undefined,
  option: MontonioPaymentOption | null | undefined,
) {
  return (
    isMontonioPaymentGateway(paymentGatewayId) &&
    needsMontonioPaymentRemint(option) &&
    Boolean(option)
  );
}

const WOO_MONTONIO_GATEWAY_IDS = [
  MONTONIO_PAYMENT_METHOD_ID,
  MONTONIO_CARD_PAYMENT_METHOD_ID,
  "wc_montonio_mobilepay",
  "wc_montonio_blik",
  "wc_montonio_bnpl",
  "wc_montonio_hire_purchase",
] as const;

/** Default Montonio provider when the UI gateway has a single implicit option. */
const MONTONIO_GATEWAY_DEFAULT_PROVIDER: Record<string, string> = {
  [MONTONIO_CARD_PAYMENT_METHOD_ID]: "cardPayments",
  "wc_montonio_mobilepay": "mobilePay",
  "wc_montonio_blik": "blik",
  "wc_montonio_bnpl": "bnpl",
  "wc_montonio_hire_purchase": "hirePurchase",
};

const MONTONIO_PROVIDER_TO_KIND: Record<string, MontonioPaymentOption["kind"]> =
  {
    cardPayments: "card",
    mobilePay: "mobilePay",
    blik: "blik",
    bnpl: "bnpl",
    hirePurchase: "hirePurchase",
  };

/** Hidden in headless checkout — WooPayments covers cards; hire/BNPL await native wiring. */
export const HEADLESS_DISABLED_MONTONIO_FINANCING_GATEWAY_IDS = new Set([
  MONTONIO_CARD_PAYMENT_METHOD_ID,
  "wc_montonio_hire_purchase",
  "wc_montonio_bnpl",
]);

const HEADLESS_DISABLED_MONTONIO_OPTION_KINDS = new Set<
  MontonioPaymentOption["kind"]
>(["card", "hirePurchase", "bnpl"]);

export function isHeadlessDisabledMontonioFinancingGateway(
  gatewayId: string,
) {
  return HEADLESS_DISABLED_MONTONIO_FINANCING_GATEWAY_IDS.has(gatewayId);
}

export function filterHeadlessDisabledMontonioFinancingGateways<
  T extends { id: string },
>(gateways: T[]) {
  return gateways.filter(
    (gateway) => !isHeadlessDisabledMontonioFinancingGateway(gateway.id),
  );
}

export function filterHeadlessDisabledMontonioFinancingOptions(
  options: MontonioPaymentOption[],
) {
  return options.filter(
    (option) => !HEADLESS_DISABLED_MONTONIO_OPTION_KINDS.has(option.kind),
  );
}

export function inferMontonioOptionFromGateway(
  paymentGatewayId: string | null | undefined,
): MontonioPaymentOption | null {
  if (!paymentGatewayId) {
    return null;
  }

  const provider = MONTONIO_GATEWAY_DEFAULT_PROVIDER[paymentGatewayId];
  if (!provider) {
    return null;
  }

  const kind = MONTONIO_PROVIDER_TO_KIND[provider];
  if (!kind) {
    return null;
  }

  return {
    code: provider,
    name: provider,
    logoUrl: null,
    systemName: provider,
    kind,
  };
}

function appendDefaultProviderMetaForGateway(
  meta: CheckoutMetaDataInput[],
  paymentGatewayId: string | null | undefined,
) {
  const provider = paymentGatewayId
    ? MONTONIO_GATEWAY_DEFAULT_PROVIDER[paymentGatewayId]
    : undefined;

  if (!provider) {
    return;
  }

  meta.push({
    key: "montonio_preferred_provider",
    value: provider,
  });
}

/**
 * Map UI / synthetic Montonio gateway ids to a gateway WooGraphQL checkout accepts.
 * Synthetic rows (e.g. card when Woo only exposes bank link) must fall back to an
 * enabled Woo Montonio gateway — otherwise checkout returns "Invalid payment method".
 */
export function resolveMontonioCheckoutGatewayId(
  selectedGatewayId: string,
  enabledGatewayIds?: readonly string[],
) {
  if (!isMontonioPaymentGateway(selectedGatewayId)) {
    return selectedGatewayId;
  }

  const enabled = enabledGatewayIds ?? [];

  // Card/BLIK/etc. cannot use Woo embedded card checkout in headless (needs session UUID).
  // Create the order via the internal pending gateway, then remint on the storefront.
  if (MONTONIO_REMINT_SUBMIT_GATEWAY_IDS.has(selectedGatewayId)) {
    if (
      enabled.includes(MOTOROCK_HEADLESS_PENDING_GATEWAY_ID) ||
      enabled.some((id) => isMontonioPaymentGateway(id))
    ) {
      return MOTOROCK_HEADLESS_PENDING_GATEWAY_ID;
    }
  }

  if (enabled.includes(selectedGatewayId)) {
    return selectedGatewayId;
  }

  const fallback = WOO_MONTONIO_GATEWAY_IDS.find((id) => enabled.includes(id));
  return fallback ?? selectedGatewayId;
}

export function pickupPointReadyForCheckout(point: PickupPoint | null | undefined) {
  return Boolean(point?.montonioItemId);
}

export function buildMontonioCheckoutMetaData(input: {
  pickupPoint?: PickupPoint | null;
  montonioOption?: MontonioPaymentOption | null;
  country?: string;
  paymentGatewayId?: string | null;
  locale?: "en" | "et";
  /** Skip Woo Montonio provider meta; payment is created via storefront remint. */
  deferMontonioPayment?: boolean;
}): CheckoutMetaDataInput[] {
  const meta: CheckoutMetaDataInput[] = [];

  if (input.locale) {
    meta.push({ key: "checkout_locale", value: input.locale });
  }

  if (input.pickupPoint?.montonioItemId) {
    meta.push(
      {
        key: "montonio_pickup_point",
        value: input.pickupPoint.montonioItemId,
      },
      {
        key: "_montonio_pickup_point_uuid",
        value: input.pickupPoint.montonioItemId,
      },
    );

    if (input.pickupPoint.carrierAssignedId) {
      meta.push({
        key: "_wc_montonio_carrier_pickup_point_id",
        value: input.pickupPoint.carrierAssignedId,
      });
    }
  }

  if (input.deferMontonioPayment) {
    meta.push({ key: "motorock_headless_defer_montonio_payment", value: "1" });
    if (input.paymentGatewayId) {
      meta.push({
        key: "motorock_headless_intended_payment_gateway",
        value: input.paymentGatewayId,
      });
    }
    return meta;
  }

  const montonioOption =
    input.montonioOption &&
    (input.paymentGatewayId == null ||
      isMontonioPaymentGateway(input.paymentGatewayId))
      ? input.montonioOption
      : null;

  if (montonioOption) {
    appendMontonioProviderMeta(meta, montonioOption, input.country);
    return meta;
  }

  appendDefaultProviderMetaForGateway(meta, input.paymentGatewayId);

  return meta;
}

function appendMontonioProviderMeta(
  meta: CheckoutMetaDataInput[],
  montonioOption: MontonioPaymentOption,
  country?: string,
) {
  const iso = country?.toUpperCase();

  switch (montonioOption.kind) {
    case "bank":
      meta.push(
        { key: "montonio_preferred_provider", value: "paymentInitiation" },
        { key: "montonio_payments_preselected_bank", value: montonioOption.code },
        ...(iso
          ? [
              { key: "montonio_preferred_country", value: iso },
              { key: "montonio_payments_preferred_country", value: iso },
            ]
          : []),
        {
          key: "montonio_preferred_bank",
          value: montonioOption.code,
        },
      );
      break;
    case "card":
      meta.push({
        key: "montonio_preferred_provider",
        value: "cardPayments",
      });
      break;
    case "mobilePay":
      meta.push({ key: "montonio_preferred_provider", value: "mobilePay" });
      break;
    case "blik":
      meta.push({ key: "montonio_preferred_provider", value: "blik" });
      break;
    case "bnpl":
      meta.push({ key: "montonio_preferred_provider", value: "bnpl" });
      break;
    case "hirePurchase":
      meta.push({
        key: "montonio_preferred_provider",
        value: "hirePurchase",
      });
      break;
    default:
      break;
  }
}
