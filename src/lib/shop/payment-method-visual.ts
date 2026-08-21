import { DEFAULT_WOO_STORE_URL } from "@/lib/storefront/url";
import { MONTONIO_CARD_PAYMENT_METHOD_ID } from "@/lib/checkout/montonio-checkout";
import { WOO_PAYMENTS_GATEWAY_ID } from "@/lib/checkout/woo-payments";
import { PAYMENT_BRAND_ICON_PATHS } from "@/lib/shop/card-payment-brands";

const MONTONIO_ASSETS =
  `${DEFAULT_WOO_STORE_URL}/wp-content/plugins/montonio-for-woocommerce/assets/images`;

/** Visa / MC / Apple Pay / Google Pay strip from Montonio API docs. */
const MONTONIO_CARD_PAYMENTS_LOGO =
  "https://public.montonio.com/images/logos/visa-mc-ap-gp.png";

export type PaymentMethodVisual =
  | { kind: "logo"; src: string; alt: string; layout?: "default" | "card" }
  | { kind: "card-brands"; alt: string }
  | { kind: "initials"; label: string };

export function resolvePaymentMethodVisual(
  gatewayId: string,
  title: string | null | undefined,
  icon?: string | null,
): PaymentMethodVisual {
  const safeTitle = title?.trim() || gatewayId;
  const id = gatewayId.toLowerCase();

  if (id === MONTONIO_CARD_PAYMENT_METHOD_ID) {
    return {
      kind: "logo",
      src: MONTONIO_CARD_PAYMENTS_LOGO,
      alt: safeTitle,
      layout: "card",
    };
  }

  if (id === WOO_PAYMENTS_GATEWAY_ID) {
    return {
      kind: "card-brands",
      alt: safeTitle,
    };
  }

  if (icon) {
    return {
      kind: "logo",
      src: icon,
      alt: safeTitle,
    };
  }

  if (id.includes("ppcp") || id.includes("paypal")) {
    return {
      kind: "logo",
      src: PAYMENT_BRAND_ICON_PATHS.paypal,
      alt: "PayPal",
      layout: "card",
    };
  }

  if (id.includes("montonio")) {
    return {
      kind: "logo",
      src: `${MONTONIO_ASSETS}/montonio-logo-mark.svg`,
      alt: "Montonio",
    };
  }

  if (id.includes("bacs") || id.includes("bank")) {
    return { kind: "initials", label: "Bank" };
  }

  if (id.includes("cod") || id.includes("cash")) {
    return { kind: "initials", label: "COD" };
  }

  const initials = safeTitle
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return { kind: "initials", label: initials || "Pay" };
}
