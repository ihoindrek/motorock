import type { CartLine } from "@/context/cart-context";
import {
  buildMontonioCheckoutMetaData,
  isMontonioPaymentGateway,
  shouldRunMontonioPaymentRemint,
} from "@/lib/checkout/montonio-checkout";
import {
  buildWooPaymentsCheckoutMetaData,
  isWooPaymentsGateway,
} from "@/lib/checkout/woo-payments";
import { runCheckoutPreflight } from "@/lib/checkout/preflight-checkout";
import type {
  CheckoutOrchestrateInput,
  CheckoutOrchestrateResult,
  CheckoutRemintInput,
} from "@/lib/checkout/orchestrate-checkout.types";
import { remintMontonioCheckoutPayment } from "@/lib/checkout/remint-montonio-checkout";
import {
  buildCheckoutInputAddresses,
  prepareCheckoutSession,
  selectShippingRate,
  submitCheckout,
  updateCheckoutCustomerShipping,
} from "@/lib/graphql/checkout";
import type { MontonioPaymentOption } from "@/types/montonio-payment";
import type { PickupPoint } from "@/types/pickup-point";

export function buildCheckoutPickupNote(input: {
  pickupPoint?: PickupPoint | null;
  paymentMethodId: string;
  montonioOption?: MontonioPaymentOption | null;
}) {
  return (
    [
      input.pickupPoint
        ? `Pakiautomaat: ${input.pickupPoint.name} (${input.pickupPoint.address}, ${input.pickupPoint.city}) [${input.pickupPoint.carrier}:${input.pickupPoint.id}]`
        : null,
      isMontonioPaymentGateway(input.paymentMethodId) && input.montonioOption
        ? `Montonio: ${input.montonioOption.systemName} / ${input.montonioOption.code}`
        : null,
    ]
      .filter(Boolean)
      .join("\n") || undefined
  );
}

export function buildRemintLineItems(
  lines: CartLine[],
  displayShipping: number,
) {
  return [
    ...lines.map((line) => ({
      name: line.size ? `${line.name} (${line.size})` : line.name,
      finalPrice: line.price * line.quantity,
      quantity: line.quantity,
    })),
    ...(displayShipping > 0
      ? [{ name: "SHIPPING", finalPrice: displayShipping, quantity: 1 }]
      : []),
  ];
}

export function buildRemintPayload(input: {
  result: {
    orderDatabaseId: number | null;
    orderNumber: string | null;
  };
  customer: CheckoutOrchestrateInput["customer"];
  billing: CheckoutRemintInput["billing"];
  shipping: CheckoutRemintInput["shipping"];
  lines: CartLine[];
  displayTotal: number;
  displayShipping: number;
  locale: "en" | "et";
  country: string;
  montonioOption: MontonioPaymentOption;
}): CheckoutRemintInput | null {
  if (!input.result.orderDatabaseId || !input.montonioOption) {
    return null;
  }

  return {
    orderDatabaseId: input.result.orderDatabaseId,
    orderNumber: input.result.orderNumber,
    total: input.displayTotal,
    currency: "EUR",
    locale: input.locale,
    country: input.country,
    montonioOption: input.montonioOption,
    billing: input.billing,
    shipping: input.shipping,
    lineItems: buildRemintLineItems(input.lines, input.displayShipping),
  };
}

type RemintHandler = (
  input: CheckoutRemintInput,
) => Promise<{ redirect: string }>;

async function remintMontonioCheckoutPaymentViaApi(input: CheckoutRemintInput) {
  if (typeof window === "undefined") {
    const payment = await remintMontonioCheckoutPayment(input);
    return { redirect: payment.redirect };
  }

  const response = await fetch("/api/checkout/orchestrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phase: "remint", ...input }),
  });

  const body = (await response.json()) as {
    ok?: boolean;
    redirect?: string;
    errors?: string[];
    error?: string;
  };

  if (!response.ok || !body.redirect) {
    throw new Error(body.errors?.[0] ?? body.error ?? "Could not create Montonio payment");
  }

  return { redirect: body.redirect };
}

/**
 * Runs the full headless checkout pipeline. GraphQL calls use the browser Woo
 * endpoint when executed client-side (required for Montonio bank link).
 */
export async function orchestrateCheckout(
  input: CheckoutOrchestrateInput,
  options?: {
    remintHandler?: RemintHandler;
  },
): Promise<CheckoutOrchestrateResult> {
  if (!input.selectedShippingRateId) {
    return {
      ok: false,
      code: "VALIDATION",
      errors: [
        input.locale === "et"
          ? "Vali tarneviis enne maksmist."
          : "Choose a delivery method before paying.",
      ],
    };
  }

  if (!input.paymentMethodId) {
    return {
      ok: false,
      code: "VALIDATION",
      errors: [
        input.locale === "et" ? "Vali makseviis." : "Choose a payment method.",
      ],
    };
  }

  let activeSession = await prepareCheckoutSession({
    lines: input.lines,
    linesKey: input.linesKey,
    sessionToken: input.sessionToken,
    selectedRateId: input.selectedShippingRateId,
    customer: input.customer,
  });

  const { billing, shipping: shippingAddress } = buildCheckoutInputAddresses(
    input.customer,
  );
  const pickupNote = buildCheckoutPickupNote({
    pickupPoint: input.pickupPoint,
    paymentMethodId: input.paymentMethodId,
    montonioOption: input.montonioOption,
  });

  const { sessionToken: customerSession } = await updateCheckoutCustomerShipping(
    input.customer,
    activeSession,
  );
  activeSession = customerSession ?? activeSession;

  const shippingSelection = await selectShippingRate(
    input.selectedShippingRateId,
    activeSession,
  );
  activeSession = shippingSelection.sessionToken ?? activeSession;

  if (!activeSession) {
    return {
      ok: false,
      code: "CHECKOUT_FAILED",
      errors: [
        input.locale === "et"
          ? "Checkout sessioon puudub. Värskenda lehte ja proovi uuesti."
          : "Checkout session is missing. Refresh the page and try again.",
      ],
    };
  }

  const preflight = await runCheckoutPreflight({
    sessionToken: activeSession,
    selectedPaymentMethodId: input.paymentMethodId,
    selectedShippingRateId: input.selectedShippingRateId,
    montonioOption: input.montonioOption,
    needsMontonioProvider: input.needsMontonioProvider,
    locale: input.locale,
  });

  if (!preflight.ok) {
    return {
      ok: false,
      code: "PREFLIGHT_FAILED",
      errors: preflight.errors,
    };
  }

  activeSession = preflight.sessionToken;

  const checkoutMetaData = [
    ...buildMontonioCheckoutMetaData({
      pickupPoint: input.pickupPoint,
      montonioOption: input.montonioOption,
      country: input.customer.country,
      paymentGatewayId: input.paymentMethodId,
      locale: input.locale,
    }),
    ...(isWooPaymentsGateway(input.paymentMethodId) &&
    input.wooPaymentsStripePaymentMethodId
      ? buildWooPaymentsCheckoutMetaData({
          stripePaymentMethodId: input.wooPaymentsStripePaymentMethodId,
          fraudPreventionToken: input.wooPaymentsFraudPreventionToken,
          locale: input.locale,
        })
      : []),
  ];

  let result;

  try {
    result = await submitCheckout(
      {
        paymentMethod: preflight.resolvedPaymentMethodId,
        billing,
        shipping: shippingAddress,
        ...(pickupNote ? { customerNote: pickupNote } : {}),
        ...(checkoutMetaData.length ? { metaData: checkoutMetaData } : {}),
      },
      activeSession,
    );
  } catch (cause) {
    return {
      ok: false,
      code: "CHECKOUT_FAILED",
      errors: [
        cause instanceof Error
          ? cause.message
          : input.locale === "et"
            ? "Makse käivitamine ebaõnnestus."
            : "Could not start payment.",
      ],
    };
  }

  activeSession = result.sessionToken ?? activeSession;
  let redirectUrl = result.redirect;

  if (
    shouldRunMontonioPaymentRemint(input.paymentMethodId, input.montonioOption) &&
    result.orderDatabaseId &&
    input.montonioOption
  ) {
    const remintPayload = buildRemintPayload({
      result,
      customer: input.customer,
      billing: {
        firstName: billing.firstName,
        lastName: billing.lastName,
        email: billing.email,
        phone: billing.phone,
        address1: billing.address1,
        city: billing.city,
        postcode: billing.postcode,
        country: billing.country,
      },
      shipping: {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        email: billing.email,
        phone: billing.phone,
        address1: shippingAddress.address1,
        city: shippingAddress.city,
        postcode: shippingAddress.postcode,
        country: shippingAddress.country,
      },
      lines: input.lines,
      displayTotal: input.displayTotal,
      displayShipping: input.displayShipping,
      locale: input.locale,
      country: input.customer.country,
      montonioOption: input.montonioOption,
    });

    if (!remintPayload) {
      return {
        ok: false,
        code: "REMINT_FAILED",
        errors: [
          input.locale === "et"
            ? "Makse käivitamine ebaõnnestus. Proovi uuesti."
            : "Could not start payment. Please try again.",
        ],
      };
    }

    try {
      const remintHandler =
        options?.remintHandler ?? remintMontonioCheckoutPaymentViaApi;
      const remint = await remintHandler(remintPayload);
      redirectUrl = remint.redirect;
    } catch (cause) {
      return {
        ok: false,
        code: "REMINT_FAILED",
        errors: [
          cause instanceof Error
            ? cause.message
            : input.locale === "et"
              ? "Makse käivitamine ebaõnnestus. Proovi uuesti."
              : "Could not start payment. Please try again.",
        ],
      };
    }
  }

  return {
    ok: true,
    redirect: redirectUrl,
    orderNumber: result.orderNumber,
    orderDatabaseId: result.orderDatabaseId,
    sessionToken: activeSession,
    resolvedPaymentMethodId: preflight.resolvedPaymentMethodId,
  };
}
