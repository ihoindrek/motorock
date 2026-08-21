"use client";

import {
  Component,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  loadStripe,
  type Stripe,
  type StripeElementLocale,
  type StripeElements,
  type StripeElementsOptions,
} from "@stripe/stripe-js";
import {
  createWooPaymentsStripePaymentMethod,
  toStripePaymentMethodBillingDetails,
  WOO_PAYMENTS_EXCLUDED_STRIPE_PAYMENT_METHODS,
  type WooPaymentsBillingDetails,
} from "@/lib/checkout/woo-payments";
import { buildStripeCheckoutAppearance } from "@/lib/checkout/stripe-appearance";
import { useDictionary } from "@/context/locale-context";
import { MorphingSquare } from "@/components/ui/morphing-square";
import { cn } from "@/lib/utils";

export type CheckoutWooPaymentsHandle = {
  createPaymentMethod: (billing: WooPaymentsBillingDetails) => Promise<string>;
  confirmPaymentIntent: (clientSecret: string) => Promise<void>;
  isReady: () => boolean;
};

export type CheckoutWooPaymentsExpressHandle = {
  confirmPaymentIntent: (clientSecret: string) => Promise<void>;
  isReady: () => boolean;
};

type WooPaymentsSharedProps = {
  publishableKey: string;
  stripeAccountId?: string;
  amountCents: number;
  locale: "en" | "et";
  billing: WooPaymentsBillingDetails;
  className?: string;
  onError?: (message: string | null) => void;
};

type CheckoutWooPaymentsExpressPanelProps = WooPaymentsSharedProps & {
  onExpressPaymentMethod: (paymentMethodId: string) => Promise<void>;
};

type CheckoutWooPaymentsPanelProps = WooPaymentsSharedProps & {
  onReadyChange?: (ready: boolean) => void;
};

type WooPaymentsErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error) => void;
};

type WooPaymentsErrorBoundaryState = {
  error: Error | null;
};

class WooPaymentsErrorBoundary extends Component<
  WooPaymentsErrorBoundaryProps,
  WooPaymentsErrorBoundaryState
> {
  state: WooPaymentsErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.error) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function buildExpressElementsOptions(input: {
  locale: StripeElementLocale;
  amountCents: number;
}): StripeElementsOptions {
  return {
    locale: input.locale,
    mode: "payment",
    amount: input.amountCents,
    currency: "eur",
    paymentMethodCreation: "manual",
    appearance: buildStripeCheckoutAppearance(),
    excludedPaymentMethodTypes: [...WOO_PAYMENTS_EXCLUDED_STRIPE_PAYMENT_METHODS],
  };
}

function buildCardElementsOptions(input: {
  locale: StripeElementLocale;
  amountCents: number;
}): StripeElementsOptions {
  return {
    locale: input.locale,
    mode: "payment",
    amount: input.amountCents,
    currency: "eur",
    paymentMethodCreation: "manual",
    appearance: buildStripeCheckoutAppearance(),
    paymentMethodTypes: ["card"],
  };
}

function useWooPaymentsStripe(publishableKey: string, stripeAccountId?: string) {
  return useMemo(
    () =>
      loadStripe(
        publishableKey,
        stripeAccountId ? { stripeAccount: stripeAccountId } : undefined,
      ),
    [publishableKey, stripeAccountId],
  );
}

async function confirmStripeCardPayment(
  stripe: Stripe | null,
  clientSecret: string,
) {
  if (!stripe) {
    throw new Error("Payment form is still loading.");
  }

  const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret);

  if (error) {
    throw new Error(error.message ?? "Payment authentication failed.");
  }

  if (
    paymentIntent?.status !== "succeeded" &&
    paymentIntent?.status !== "processing" &&
    paymentIntent?.status !== "requires_capture"
  ) {
    throw new Error("Payment was not completed.");
  }
}

function CheckoutWooPaymentsExpressCheckout({
  forwardedRef,
  billing,
  onError,
  onExpressPaymentMethod,
  onAvailabilityChange,
}: {
  forwardedRef: Ref<CheckoutWooPaymentsExpressHandle>;
  billing: WooPaymentsBillingDetails;
  onError?: (message: string | null) => void;
  onExpressPaymentMethod: (paymentMethodId: string) => Promise<void>;
  onAvailabilityChange?: (available: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);

  useImperativeHandle(
    forwardedRef,
    () => ({
      isReady: () => Boolean(stripe && ready),
      confirmPaymentIntent: (clientSecret) =>
        confirmStripeCardPayment(stripe, clientSecret),
    }),
    [ready, stripe],
  );

  return (
    <ExpressCheckoutElement
      onReady={({ availablePaymentMethods }) => {
        const available = Boolean(
          availablePaymentMethods &&
            (availablePaymentMethods.applePay ||
              availablePaymentMethods.googlePay ||
              availablePaymentMethods.link),
        );
        setReady(available);
        onAvailabilityChange?.(available);
      }}
      onConfirm={async (event) => {
        if (!stripe || !elements) {
          event.paymentFailed({
            reason: "fail",
            message: "Payment form is still loading.",
          });
          return;
        }

        onError?.(null);

        try {
          const submitResult = await elements.submit();
          if (submitResult.error) {
            throw new Error(
              submitResult.error.message ?? "Payment validation failed.",
            );
          }

          const { paymentMethod, error } = await stripe.createPaymentMethod({
            elements,
            params: {
              billing_details: toStripePaymentMethodBillingDetails(billing),
            },
          });

          if (error || !paymentMethod) {
            throw new Error(error?.message ?? "Could not create payment method.");
          }

          await onExpressPaymentMethod(paymentMethod.id);
        } catch (cause) {
          const message =
            cause instanceof Error
              ? cause.message
              : "Payment could not be completed.";
          onError?.(message);
          event.paymentFailed({
            reason: "fail",
            message,
          });
        }
      }}
      options={{
        paymentMethods: {
          applePay: "always",
          googlePay: "always",
          link: "auto",
          paypal: "never",
          amazonPay: "never",
          klarna: "never",
        },
        layout: {
          maxColumns: 1,
          maxRows: 2,
        },
      }}
    />
  );
}

export const CheckoutWooPaymentsExpressPanel = forwardRef<
  CheckoutWooPaymentsExpressHandle,
  CheckoutWooPaymentsExpressPanelProps
>(function CheckoutWooPaymentsExpressPanel(
  {
    publishableKey,
    stripeAccountId,
    amountCents,
    locale,
    billing,
    className,
    onError,
    onExpressPaymentMethod,
  },
  ref,
) {
  const dict = useDictionary();
  const stripePromise = useWooPaymentsStripe(publishableKey, stripeAccountId);
  const elementsInstanceKey = `${billing.address.country || "xx"}:${amountCents}`;
  const expressElementsOptions = useMemo(
    () => buildExpressElementsOptions({ locale, amountCents }),
    [amountCents, locale],
  );
  const [availability, setAvailability] = useState<
    "pending" | "available" | "unavailable"
  >("pending");

  if (!publishableKey || amountCents <= 0 || availability === "unavailable") {
    return null;
  }

  return (
    <WooPaymentsErrorBoundary
      onError={(error) => onError?.(error.message)}
      fallback={
        <p className="text-sm text-accent" role="alert">
          {dict.checkout.paymentError}
        </p>
      }
    >
      <div
        className={cn(
          availability === "pending" && "min-h-12",
          className,
        )}
      >
        <Elements
          key={`express-${elementsInstanceKey}`}
          stripe={stripePromise}
          options={expressElementsOptions}
        >
          <div className="rounded-sm border border-ink/10 bg-ink/[0.015] p-3 sm:p-4">
            <CheckoutWooPaymentsExpressCheckout
              forwardedRef={ref}
              billing={billing}
              onError={onError}
              onExpressPaymentMethod={onExpressPaymentMethod}
              onAvailabilityChange={(available) => {
                setAvailability(available ? "available" : "unavailable");
              }}
            />
          </div>
        </Elements>
      </div>
    </WooPaymentsErrorBoundary>
  );
});

function CheckoutWooPaymentsCardForm({
  forwardedRef,
  billing,
  onReadyChange,
  onError,
}: {
  forwardedRef: Ref<CheckoutWooPaymentsHandle>;
  billing: WooPaymentsBillingDetails;
  onReadyChange?: (ready: boolean) => void;
  onError?: (message: string | null) => void;
}) {
  const dict = useDictionary();
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);

  useImperativeHandle(
    forwardedRef,
    () => ({
      isReady: () => Boolean(stripe && elements && ready),
      createPaymentMethod: async (billingDetails) => {
        if (!stripe || !elements) {
          throw new Error("Payment form is still loading.");
        }

        return createWooPaymentsStripePaymentMethod({
          stripe,
          elements,
          billing: billingDetails,
        });
      },
      confirmPaymentIntent: (clientSecret) =>
        confirmStripeCardPayment(stripe, clientSecret),
    }),
    [elements, ready, stripe],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-ink/10 pb-3">
        <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
          {dict.checkout.paymentWooPaymentsFormTitle}
        </p>
        <p className="shrink-0 pt-0.5 text-[11px] text-ink/40">
          {dict.checkout.securePayment}
        </p>
      </div>

      <div className="relative min-h-[7.5rem]">
        {!ready ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/85">
            <MorphingSquare size="sm" />
          </div>
        ) : null}

        <PaymentElement
          onReady={() => {
            setReady(true);
            onReadyChange?.(true);
          }}
          onLoadError={(event) => {
            setReady(false);
            onReadyChange?.(false);
            onError?.(event.error.message ?? "Payment form failed to load.");
          }}
          onChange={() => {
            onError?.(null);
          }}
          options={{
            fields: {
              billingDetails: {
                name: "never",
                email: "never",
                phone: "never",
                address: "never",
              },
            },
            wallets: {
              applePay: "never",
              googlePay: "never",
              link: "never",
            },
            defaultValues: {
              billingDetails: {
                name: billing.name || undefined,
                email: billing.email || undefined,
                phone: billing.phone || undefined,
                address: {
                  line1: billing.address.line1 || undefined,
                  city: billing.address.city || undefined,
                  postal_code: billing.address.postal_code || undefined,
                  country: billing.address.country || undefined,
                  state:
                    toStripePaymentMethodBillingDetails(billing).address
                      ?.state || undefined,
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}

export const CheckoutWooPaymentsPanel = forwardRef<
  CheckoutWooPaymentsHandle,
  CheckoutWooPaymentsPanelProps
>(function CheckoutWooPaymentsPanel(
  {
    publishableKey,
    stripeAccountId,
    amountCents,
    locale,
    billing,
    className,
    onReadyChange,
    onError,
  },
  ref,
) {
  const dict = useDictionary();
  const stripePromise = useWooPaymentsStripe(publishableKey, stripeAccountId);
  const elementsInstanceKey = `${billing.address.country || "xx"}:${amountCents}`;
  const cardElementsOptions = useMemo(
    () => buildCardElementsOptions({ locale, amountCents }),
    [amountCents, locale],
  );

  useEffect(() => {
    onReadyChange?.(false);
  }, [elementsInstanceKey, onReadyChange]);

  if (!publishableKey || amountCents <= 0) {
    return null;
  }

  return (
    <WooPaymentsErrorBoundary
      onError={(error) => {
        onReadyChange?.(false);
        onError?.(error.message);
      }}
      fallback={
        <p className="text-sm text-accent" role="alert">
          {dict.checkout.paymentError}
        </p>
      }
    >
      <div className={cn("relative", className)}>
        <Elements
          key={`card-${elementsInstanceKey}`}
          stripe={stripePromise}
          options={cardElementsOptions}
        >
          <CheckoutWooPaymentsCardForm
            forwardedRef={ref}
            billing={billing}
            onReadyChange={onReadyChange}
            onError={onError}
          />
        </Elements>
      </div>
    </WooPaymentsErrorBoundary>
  );
});

export type { Stripe, StripeElements };
