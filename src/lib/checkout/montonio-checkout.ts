import type { MontonioPaymentOption } from "@/types/montonio-payment";
import type { PickupPoint } from "@/types/pickup-point";
import { MONTONIO_PAYMENT_METHOD_ID } from "@/lib/graphql/checkout";

export const MONTONIO_CARD_PAYMENT_METHOD_ID = "wc_montonio_card";

export type CheckoutMetaDataInput = {
  key: string;
  value: string;
};

export function isMontonioPaymentGateway(gatewayId: string | null | undefined) {
  return Boolean(gatewayId?.toLowerCase().includes("montonio"));
}

/** Card/BLIK/BNPL need a server-side Montonio order — Woo bank gateway ignores meta. */
export function needsMontonioPaymentRemint(
  option: MontonioPaymentOption | null | undefined,
) {
  return Boolean(option && option.kind !== "bank");
}

/**
 * Montonio redirect checkout uses `wc_montonio_payments` in headless GraphQL.
 * Non-bank methods (card, BLIK, BNPL) are selected via order meta and applied
 * on WooCommerce by `wordpress/motorock-headless-montonio.php`.
 */
export function resolveMontonioCheckoutGatewayId(
  selectedGatewayId: string,
) {
  if (isMontonioPaymentGateway(selectedGatewayId)) {
    return MONTONIO_PAYMENT_METHOD_ID;
  }

  return selectedGatewayId;
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

  if (input.montonioOption) {
    appendMontonioProviderMeta(meta, input.montonioOption, input.country);
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
