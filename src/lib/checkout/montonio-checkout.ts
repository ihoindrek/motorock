import type { MontonioPaymentOption } from "@/types/montonio-payment";
import type { PickupPoint } from "@/types/pickup-point";

export const MONTONIO_PAYMENT_METHOD_ID = "wc_montonio_payments";
export const MONTONIO_CARD_PAYMENT_METHOD_ID = "wc_montonio_card";

export type CheckoutMetaDataInput = {
  key: string;
  value: string;
};

export function isMontonioPaymentGateway(gatewayId: string | null | undefined) {
  return Boolean(gatewayId?.toLowerCase().includes("montonio"));
}

/** Headless checkout always mints Montonio payment URLs server-side (incl. bank link). */
export function needsMontonioPaymentRemint(
  option: MontonioPaymentOption | null | undefined,
) {
  return Boolean(option);
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
  if (enabled.includes(selectedGatewayId)) {
    return selectedGatewayId;
  }

  const fallback = WOO_MONTONIO_GATEWAY_IDS.find((id) => enabled.includes(id));
  return fallback ?? MONTONIO_PAYMENT_METHOD_ID;
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

  if (input.paymentGatewayId === MONTONIO_CARD_PAYMENT_METHOD_ID) {
    meta.push({
      key: "montonio_preferred_provider",
      value: "cardPayments",
    });
  }

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
