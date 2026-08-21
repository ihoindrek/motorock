import { DEFAULT_WOO_STORE_URL } from "@/lib/storefront/url";

const WOO_PAYMENTS_CARDS_BASE =
  `${DEFAULT_WOO_STORE_URL}/wp-content/plugins/woocommerce-payments/assets/images/cards`;
const WOO_PAYMENTS_METHODS_BASE =
  `${DEFAULT_WOO_STORE_URL}/wp-content/plugins/woocommerce-payments/assets/images/payment-methods`;

/** Local checkout payment brand icons (public/payment-brands). */
export const PAYMENT_BRAND_ICON_PATHS = {
  visa: "/payment-brands/visa.svg?v=2",
  mastercard: "/payment-brands/mastercard.svg?v=2",
  amex: "/payment-brands/amex.svg?v=2",
  paypal: "/payment-brands/paypal.svg?v=2",
  applePay: "/payment-brands/apple-pay.svg?v=1",
  googlePay: "/payment-brands/google-pay.svg?v=1",
} as const;

export type CardPaymentBrand = {
  id: string;
  label: string;
  src: string;
};

export const WOO_PAYMENTS_KLARNA_BRAND: CardPaymentBrand = {
  id: "klarna",
  label: "Klarna",
  src: `${WOO_PAYMENTS_METHODS_BASE}/klarna.svg`,
};

/** Card networks supported by WooPayments / Stripe card payments in the EU storefront. */
export const WOO_PAYMENTS_CARD_BRANDS: readonly CardPaymentBrand[] = [
  {
    id: "visa",
    label: "Visa",
    src: PAYMENT_BRAND_ICON_PATHS.visa,
  },
  {
    id: "mastercard",
    label: "Mastercard",
    src: PAYMENT_BRAND_ICON_PATHS.mastercard,
  },
  {
    id: "amex",
    label: "American Express",
    src: PAYMENT_BRAND_ICON_PATHS.amex,
  },
  {
    id: "discover",
    label: "Discover",
    src: `${WOO_PAYMENTS_CARDS_BASE}/discover.svg`,
  },
  {
    id: "diners",
    label: "Diners Club",
    src: `${WOO_PAYMENTS_CARDS_BASE}/diners.svg`,
  },
  { id: "jcb", label: "JCB", src: `${WOO_PAYMENTS_CARDS_BASE}/jcb.svg` },
  {
    id: "unionpay",
    label: "UnionPay",
    src: `${WOO_PAYMENTS_CARDS_BASE}/unionpay.svg`,
  },
] as const;

/** Primary networks shown in checkout UI (EU storefront). */
export const WOO_PAYMENTS_PRIMARY_CARD_BRANDS: readonly CardPaymentBrand[] = [
  WOO_PAYMENTS_CARD_BRANDS[0],
  WOO_PAYMENTS_CARD_BRANDS[1],
  WOO_PAYMENTS_CARD_BRANDS[2],
] as const;

/** Logos shown for WooPayments in checkout (card networks). */
export const WOO_PAYMENTS_CHECKOUT_LOGOS: readonly CardPaymentBrand[] =
  WOO_PAYMENTS_PRIMARY_CARD_BRANDS;

/** Primary payment options promoted on equipment product pages. */
export const EQUIPMENT_PDP_PAYMENT_BRANDS: readonly CardPaymentBrand[] = [
  {
    id: "applePay",
    label: "Apple Pay",
    src: PAYMENT_BRAND_ICON_PATHS.applePay,
  },
  {
    id: "googlePay",
    label: "Google Pay",
    src: PAYMENT_BRAND_ICON_PATHS.googlePay,
  },
  WOO_PAYMENTS_CARD_BRANDS[0],
  WOO_PAYMENTS_CARD_BRANDS[1],
] as const;

export function cardPaymentBrandAriaLabel(
  brands: readonly CardPaymentBrand[] = WOO_PAYMENTS_CARD_BRANDS,
) {
  return brands.map((brand) => brand.label).join(", ");
}
