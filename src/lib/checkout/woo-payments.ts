import type { CheckoutMetaDataInput } from "@/lib/checkout/montonio-checkout";

export const WOO_PAYMENTS_GATEWAY_ID = "woocommerce_payments";

/** Stripe account must support Klarna in EUR before enabling in checkout UI. */
export const WOO_PAYMENTS_EXCLUDED_STRIPE_PAYMENT_METHODS = ["klarna"] as const;

export function isWooPaymentsGateway(gatewayId: string | null | undefined) {
  return gatewayId === WOO_PAYMENTS_GATEWAY_ID;
}

export function buildWooPaymentsCheckoutMetaData(input: {
  stripePaymentMethodId: string;
  fraudPreventionToken?: string | null;
  locale: "en" | "et";
}): CheckoutMetaDataInput[] {
  const meta: CheckoutMetaDataInput[] = [
    {
      key: "wcpay_payment_method",
      value: input.stripePaymentMethodId,
    },
    {
      key: "checkout_locale",
      value: input.locale,
    },
  ];

  if (input.fraudPreventionToken) {
    meta.push({
      key: "wcpay_fraud_prevention_token",
      value: input.fraudPreventionToken,
    });
  }

  return meta;
}

export type WooPaymentsConfig = {
  publishableKey: string;
  testMode: boolean;
  gatewayEnabled: boolean;
  fraudPreventionToken: string;
};

export async function fetchWooPaymentsConfig(
  sessionToken?: string | null,
): Promise<WooPaymentsConfig> {
  const headers: Record<string, string> = {};

  if (sessionToken) {
    headers["x-woo-session"] = sessionToken;
  }

  const response = await fetch("/api/checkout/woo-payments/config", {
    headers,
    cache: "no-store",
  });

  const body = (await response.json()) as WooPaymentsConfig & {
    error?: string;
    message?: string;
  };

  if (!response.ok || !body.publishableKey) {
    throw new Error(
      body.message ?? body.error ?? "WooPayments configuration is unavailable.",
    );
  }

  return body;
}

export type WooPaymentsBillingDetails = {
  name: string;
  email: string;
  phone?: string;
  address: {
    line1: string;
    city: string;
    postal_code: string;
    country: string;
  };
};

export async function createWooPaymentsStripePaymentMethod(input: {
  stripe: import("@stripe/stripe-js").Stripe;
  elements: import("@stripe/stripe-js").StripeElements;
  billing: WooPaymentsBillingDetails;
}) {
  const submitResult = await input.elements.submit();

  if (submitResult.error) {
    throw new Error(submitResult.error.message ?? "Card validation failed.");
  }

  const { paymentMethod, error } = await input.stripe.createPaymentMethod({
    elements: input.elements,
    params: {
      billing_details: input.billing,
    },
  });

  if (error || !paymentMethod) {
    throw new Error(error?.message ?? "Could not create payment method.");
  }

  return paymentMethod.id;
}
