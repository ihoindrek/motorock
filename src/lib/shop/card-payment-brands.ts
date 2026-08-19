import { DEFAULT_WOO_STORE_URL } from "@/lib/storefront/url";

const WOO_PAYMENTS_CARDS_BASE =
  `${DEFAULT_WOO_STORE_URL}/wp-content/plugins/woocommerce-payments/assets/images/cards`;
const WOO_PAYMENTS_METHODS_BASE =
  `${DEFAULT_WOO_STORE_URL}/wp-content/plugins/woocommerce-payments/assets/images/payment-methods`;

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
  { id: "visa", label: "Visa", src: `${WOO_PAYMENTS_CARDS_BASE}/visa.svg` },
  {
    id: "mastercard",
    label: "Mastercard",
    src: `${WOO_PAYMENTS_CARDS_BASE}/mastercard.svg`,
  },
  {
    id: "amex",
    label: "American Express",
    src: `${WOO_PAYMENTS_CARDS_BASE}/amex.svg`,
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

/** Logos shown for WooPayments in checkout (card networks). */
export const WOO_PAYMENTS_CHECKOUT_LOGOS: readonly CardPaymentBrand[] =
  WOO_PAYMENTS_CARD_BRANDS;

export function cardPaymentBrandAriaLabel(
  brands: readonly CardPaymentBrand[] = WOO_PAYMENTS_CARD_BRANDS,
) {
  return brands.map((brand) => brand.label).join(", ");
}
