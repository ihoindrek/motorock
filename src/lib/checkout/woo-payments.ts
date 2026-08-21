import type { CheckoutMetaDataInput } from "@/lib/checkout/montonio-checkout";
import { readJsonResponse } from "@/lib/http/read-json-response";

export const WOO_PAYMENTS_GATEWAY_ID = "woocommerce_payments";

/** Stripe account must support Klarna in EUR before enabling in checkout UI. */
export const WOO_PAYMENTS_EXCLUDED_STRIPE_PAYMENT_METHODS = ["klarna"] as const;

export function isWooPaymentsGateway(gatewayId: string | null | undefined) {
  return gatewayId === WOO_PAYMENTS_GATEWAY_ID;
}

export function buildWooPaymentsCheckoutMetaData(input: {
  stripePaymentMethodId?: string;
  stripeConfirmationToken?: string;
  fraudPreventionToken?: string | null;
  locale: "en" | "et";
}): CheckoutMetaDataInput[] {
  const meta: CheckoutMetaDataInput[] = [
    {
      key: "checkout_locale",
      value: input.locale,
    },
  ];

  if (input.stripeConfirmationToken) {
    meta.unshift({
      key: "wcpay_confirmation_token",
      value: input.stripeConfirmationToken,
    });
  } else if (input.stripePaymentMethodId) {
    meta.unshift({
      key: "wcpay_payment_method",
      value: input.stripePaymentMethodId,
    });
  }

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
  stripeAccountId?: string;
  testMode: boolean;
  gatewayEnabled: boolean;
  fraudPreventionEnabled?: boolean;
  fraudPreventionToken: string;
  storefrontDomain?: string;
  storefrontDomainStatus?: Record<string, unknown> | null;
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

  const body = await readJsonResponse<
    WooPaymentsConfig & {
      error?: string;
      message?: string;
    }
  >(response);

  if (!response.ok || !body?.publishableKey) {
    throw new Error(
      body?.message ??
        body?.error ??
        "WooPayments configuration is unavailable.",
    );
  }

  return body;
}

export async function fetchWooPaymentsLastError(
  sessionToken?: string | null,
): Promise<string | null> {
  const headers: Record<string, string> = {};

  if (sessionToken) {
    headers["x-woo-session"] = sessionToken;
  }

  try {
    const response = await fetch("/api/checkout/woo-payments/last-error", {
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const body = await readJsonResponse<{ message?: string | null }>(response);
    const message = body?.message?.trim();

    return message ? message : null;
  } catch {
    return null;
  }
}

export async function fetchWooPaymentsOrderError(
  orderId: number,
  sessionToken?: string | null,
): Promise<string | null> {
  const headers: Record<string, string> = {};

  if (sessionToken) {
    headers["x-woo-session"] = sessionToken;
  }

  try {
    const response = await fetch(
      `/api/checkout/woo-payments/order-error/${orderId}`,
      {
        headers,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    const body = await readJsonResponse<{ message?: string | null }>(response);
    const message = body?.message?.trim();

    return message ? message : null;
  } catch {
    return null;
  }
}

export type WooPaymentsConfirmRedirect = {
  kind: "pi" | "si";
  orderId: string;
  clientSecret: string;
  nonce: string;
  intentId: string;
};

export function parseWooPaymentsConfirmRedirect(
  redirect: string | null | undefined,
): WooPaymentsConfirmRedirect | null {
  if (!redirect?.startsWith("#wcpay-confirm-")) {
    return null;
  }

  const parts = redirect.slice("#wcpay-confirm-".length).split(":");
  if (parts.length < 4) {
    return null;
  }

  const [kind, orderId, clientSecret, nonce] = parts;
  if (
    (kind !== "pi" && kind !== "si") ||
    !orderId ||
    !clientSecret ||
    !nonce
  ) {
    return null;
  }

  const intentId = clientSecret.split("_secret_")[0] ?? "";

  return {
    kind,
    orderId,
    clientSecret,
    nonce,
    intentId,
  };
}

export async function completeWooPaymentsCheckoutRedirect(input: {
  redirectUrl: string | null | undefined;
  confirmPaymentIntent: (clientSecret: string) => Promise<void>;
  loadingMessage?: string;
}): Promise<string | null> {
  const confirmRedirect = parseWooPaymentsConfirmRedirect(input.redirectUrl);
  if (confirmRedirect?.kind === "pi") {
    await input.confirmPaymentIntent(confirmRedirect.clientSecret);
    return null;
  }

  return input.redirectUrl ?? null;
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
    state?: string;
  };
};

const STRIPE_STATE_REQUIRED_COUNTRIES = new Set([
  "AU",
  "BR",
  "CA",
  "IN",
  "MX",
  "MY",
  "US",
]);

/** Stripe requires full address (incl. state) when Payment Element skips billing fields. */
export function toStripePaymentMethodBillingDetails(
  billing: WooPaymentsBillingDetails,
): import("@stripe/stripe-js").PaymentMethodCreateParams.BillingDetails {
  const country = billing.address.country.trim().toUpperCase();
  const state =
    billing.address.state?.trim() ||
    (STRIPE_STATE_REQUIRED_COUNTRIES.has(country)
      ? billing.address.city.trim()
      : "");

  return {
    name: billing.name || undefined,
    email: billing.email || undefined,
    phone: billing.phone || undefined,
    address: {
      line1: billing.address.line1 || undefined,
      city: billing.address.city || undefined,
      postal_code: billing.address.postal_code || undefined,
      country: country || undefined,
      state,
    },
  };
}

export async function createWooPaymentsStripePaymentMethod(input: {
  stripe: import("@stripe/stripe-js").Stripe;
  elements: import("@stripe/stripe-js").StripeElements;
  billing: WooPaymentsBillingDetails;
}) {
  const submitResult = await input.elements.submit();

  if (submitResult.error) {
    throw new Error(submitResult.error.message ?? "Card validation failed.");
  }

  const billingDetails = toStripePaymentMethodBillingDetails(input.billing);

  if (typeof input.stripe.createConfirmationToken === "function") {
    const { confirmationToken, error } = await input.stripe.createConfirmationToken({
      elements: input.elements,
      params: {
        payment_method_data: {
          billing_details: billingDetails,
        },
      },
    });

    if (error || !confirmationToken) {
      throw new Error(error?.message ?? "Could not create payment token.");
    }

    return confirmationToken.id;
  }

  const { paymentMethod, error } = await input.stripe.createPaymentMethod({
    elements: input.elements,
    params: {
      billing_details: billingDetails,
    },
  });

  if (error || !paymentMethod) {
    throw new Error(error?.message ?? "Could not create payment method.");
  }

  return paymentMethod.id;
}
