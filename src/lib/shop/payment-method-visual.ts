import { DEFAULT_WOO_STORE_URL } from "@/lib/storefront/url";

const MONTONIO_ASSETS =
  `${DEFAULT_WOO_STORE_URL}/wp-content/plugins/montonio-for-woocommerce/assets/images`;

export type PaymentMethodVisual =
  | { kind: "logo"; src: string; alt: string }
  | { kind: "initials"; label: string };

export function resolvePaymentMethodVisual(
  gatewayId: string,
  title: string,
  icon?: string | null,
): PaymentMethodVisual {
  if (icon) {
    return {
      kind: "logo",
      src: icon,
      alt: title,
    };
  }

  const id = gatewayId.toLowerCase();

  if (id.includes("ppcp") || id.includes("paypal")) {
    return {
      kind: "logo",
      src: `${DEFAULT_WOO_STORE_URL}/wp-content/plugins/woocommerce-paypal-payments/modules/ppcp-wc-gateway/assets/images/paypal.svg`,
      alt: "PayPal",
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

  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return { kind: "initials", label: initials || "Pay" };
}
