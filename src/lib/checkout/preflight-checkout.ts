import {
  MONTONIO_PAYMENT_METHOD_ID,
  resolveMontonioCheckoutGatewayId,
} from "@/lib/checkout/montonio-checkout";
import {
  fetchCartItemCount,
  fetchCartShipping,
  fetchWooPaymentGatewayIds,
} from "@/lib/graphql/checkout";
import type { MontonioPaymentOption } from "@/types/montonio-payment";

export type CheckoutPreflightInput = {
  selectedPaymentMethodId: string;
  selectedShippingRateId: string;
  wooPaymentGatewayIds: readonly string[];
  cartItemCount: number;
  availableShippingRateIds: readonly string[];
  chosenShippingMethods?: readonly string[] | null;
  montonioOption?: MontonioPaymentOption | null;
  needsMontonioProvider?: boolean;
  locale?: "en" | "et";
};

export type CheckoutPreflightResult = {
  ok: boolean;
  resolvedPaymentMethodId: string;
  errors: string[];
};

function preflightMessage(locale: "en" | "et", et: string, en: string) {
  return locale === "et" ? et : en;
}

export function validateCheckoutPreflight(
  input: CheckoutPreflightInput,
): CheckoutPreflightResult {
  const errors: string[] = [];
  const locale = input.locale ?? "et";

  if (input.cartItemCount <= 0) {
    errors.push(
      preflightMessage(locale, "Ostukorv on tühi.", "Your cart is empty."),
    );
  }

  if (!input.selectedShippingRateId) {
    errors.push(
      preflightMessage(locale, "Vali tarneviis.", "Choose a delivery method."),
    );
  } else {
    const chosenShippingMethods = input.chosenShippingMethods ?? [];
    const shippingReady =
      chosenShippingMethods.includes(input.selectedShippingRateId) ||
      input.availableShippingRateIds.includes(input.selectedShippingRateId);

    if (!shippingReady) {
      errors.push(
        preflightMessage(
          locale,
          "Valitud tarneviis pole enam saadaval. Vali uus tarneviis.",
          "The selected delivery method is no longer available. Choose another.",
        ),
      );
    }
  }

  if (!input.selectedPaymentMethodId) {
    errors.push(
      preflightMessage(locale, "Vali makseviis.", "Choose a payment method."),
    );
  }

  if (input.needsMontonioProvider && !input.montonioOption) {
    errors.push(
      preflightMessage(
        locale,
        "Vali pank või makseviis Montonio alt.",
        "Choose a bank or payment option under Montonio.",
      ),
    );
  }

  const resolved = input.selectedPaymentMethodId
    ? resolveMontonioCheckoutGatewayId(
        input.selectedPaymentMethodId,
        input.wooPaymentGatewayIds,
      )
    : "";

  const bankLinkRequested =
    input.selectedPaymentMethodId === MONTONIO_PAYMENT_METHOD_ID ||
    input.montonioOption?.kind === "bank";

  if (
    bankLinkRequested &&
    !input.wooPaymentGatewayIds.includes(MONTONIO_PAYMENT_METHOD_ID)
  ) {
    errors.push(
      preflightMessage(
        locale,
        "Pangalink pole hetkel saadaval. Proovi kaardimakset või PayPal'i.",
        "Bank link is not available right now. Try card payment or PayPal.",
      ),
    );
  } else if (
    input.selectedPaymentMethodId &&
    !input.wooPaymentGatewayIds.includes(resolved)
  ) {
    errors.push(
      preflightMessage(
        locale,
        "Valitud makseviis pole hetkel saadaval. Vali teine makseviis.",
        "The selected payment method is not available. Choose another.",
      ),
    );
  }

  return {
    ok: errors.length === 0,
    resolvedPaymentMethodId: resolved || input.selectedPaymentMethodId,
    errors,
  };
}

export async function runCheckoutPreflight(input: {
  sessionToken: string;
  selectedPaymentMethodId: string;
  selectedShippingRateId: string;
  montonioOption?: MontonioPaymentOption | null;
  needsMontonioProvider?: boolean;
  locale?: "en" | "et";
}): Promise<CheckoutPreflightResult & { sessionToken: string }> {
  const [wooPaymentGatewayIds, cartItemCount, shipping] = await Promise.all([
    fetchWooPaymentGatewayIds(input.sessionToken),
    fetchCartItemCount(input.sessionToken),
    fetchCartShipping(input.sessionToken),
  ]);

  const result = validateCheckoutPreflight({
    selectedPaymentMethodId: input.selectedPaymentMethodId,
    selectedShippingRateId: input.selectedShippingRateId,
    wooPaymentGatewayIds,
    cartItemCount,
    availableShippingRateIds: shipping.rates.map((rate) => rate.id),
    chosenShippingMethods: shipping.cart.chosenShippingMethods ?? [],
    montonioOption: input.montonioOption,
    needsMontonioProvider: input.needsMontonioProvider,
    locale: input.locale,
  });

  return {
    ...result,
    sessionToken: shipping.sessionToken ?? input.sessionToken,
  };
}
