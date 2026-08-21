import type { CartLine } from "@/context/cart-context";
import {
  fetchCartShipping,
  parseCartMoney,
  prepareCheckoutSession,
} from "@/lib/graphql/checkout";

export async function prepareWooPaymentsChargeAmount(input: {
  lines: CartLine[];
  linesKey: string;
  sessionToken?: string | null;
  selectedShippingRateId: string;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    country: string;
    postcode: string;
    city: string;
    address1: string;
  };
  expectedAmountCents: number;
  locale: "en" | "et";
}) {
  const sessionToken = await prepareCheckoutSession({
    lines: input.lines,
    linesKey: input.linesKey,
    sessionToken: input.sessionToken,
    selectedRateId: input.selectedShippingRateId,
    customer: input.customer,
  });

  if (!sessionToken) {
    throw new Error(
      input.locale === "et"
        ? "Checkout sessioon puudub. Värskenda lehte ja proovi uuesti."
        : "Checkout session is missing. Refresh the page and try again.",
    );
  }

  const cart = await fetchCartShipping(sessionToken);
  const total = parseCartMoney(cart.cart.total);
  const amountCents = Math.max(0, Math.round(total * 100));

  if (amountCents !== input.expectedAmountCents) {
    throw new Error(
      input.locale === "et"
        ? "Tellimuse summa muutus. Oota, kuni kaardivorm värskendub, ja proovi uuesti."
        : "The order total changed. Wait for the card form to refresh and try again.",
    );
  }

  return {
    sessionToken,
    total,
    amountCents,
  };
}
