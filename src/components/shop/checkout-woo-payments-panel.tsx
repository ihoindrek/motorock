"use client";

import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
  type Ref,
} from "react";
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import {
  createWooPaymentsStripePaymentMethod,
  WOO_PAYMENTS_EXCLUDED_STRIPE_PAYMENT_METHODS,
  type WooPaymentsBillingDetails,
} from "@/lib/checkout/woo-payments";
import { buildStripeCheckoutAppearance } from "@/lib/checkout/stripe-appearance";
import { useDictionary } from "@/context/locale-context";
import { MorphingSquare } from "@/components/ui/morphing-square";
import { cn } from "@/lib/utils";

export type CheckoutWooPaymentsHandle = {
  createPaymentMethod: (billing: WooPaymentsBillingDetails) => Promise<string>;
  isReady: () => boolean;
};

type CheckoutWooPaymentsPanelProps = {
  publishableKey: string;
  amountCents: number;
  locale: "en" | "et";
  billing: WooPaymentsBillingDetails;
  orCardLabel: string;
  className?: string;
  onReadyChange?: (ready: boolean) => void;
  onError?: (message: string | null) => void;
  onExpressPaymentMethod?: (paymentMethodId: string) => Promise<void>;
};

function CheckoutWooPaymentsForm({
  forwardedRef,
  billing,
  orCardLabel,
  onReadyChange,
  onError,
  onExpressPaymentMethod,
}: {
  forwardedRef: Ref<CheckoutWooPaymentsHandle>;
  billing: WooPaymentsBillingDetails;
  orCardLabel: string;
  onReadyChange?: (ready: boolean) => void;
  onError?: (message: string | null) => void;
  onExpressPaymentMethod?: (paymentMethodId: string) => Promise<void>;
}) {
  const dict = useDictionary();
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [expressAvailability, setExpressAvailability] = useState<
    "pending" | "available" | "none"
  >("pending");

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
    }),
    [elements, ready, stripe],
  );

  return (
    <div className="space-y-5">
      {onExpressPaymentMethod ? (
        <div
          className={cn(
            expressAvailability === "pending" && "h-0 overflow-hidden opacity-0",
            expressAvailability === "none" && "hidden",
          )}
        >
          <ExpressCheckoutElement
            onReady={({ availablePaymentMethods }) => {
              const available = Boolean(
                availablePaymentMethods &&
                  Object.values(availablePaymentMethods).some(Boolean),
              );
              setExpressAvailability(available ? "available" : "none");
            }}
            onConfirm={async (event) => {
              if (!stripe || !elements || !onExpressPaymentMethod) {
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

                const { paymentMethod, error } = await stripe.createPaymentMethod(
                  {
                    elements,
                    params: {
                      billing_details: billing,
                    },
                  },
                );

                if (error || !paymentMethod) {
                  throw new Error(
                    error?.message ?? "Could not create payment method.",
                  );
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
        </div>
      ) : null}

      {expressAvailability === "available" ? (
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-ink/10" aria-hidden="true" />
          <span className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/40">
            {orCardLabel}
          </span>
          <span className="h-px flex-1 bg-ink/10" aria-hidden="true" />
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
            {dict.checkout.paymentWooPaymentsFormTitle}
          </p>
          <p className="text-[11px] text-ink/40">{dict.checkout.securePayment}</p>
        </div>

        <div className="relative min-h-[8.5rem]">
          {!ready ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/85">
              <MorphingSquare size="sm" />
            </div>
          ) : null}

          <PaymentElement
            key={billing.address.country || "no-country"}
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
              layout: {
                type: "accordion",
                defaultCollapsed: false,
                spacedAccordionItems: true,
              },
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
                  },
                },
              },
            }}
          />
        </div>
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
    amountCents,
    locale,
    billing,
    orCardLabel,
    className,
    onReadyChange,
    onError,
    onExpressPaymentMethod,
  },
  ref,
) {
  const stripePromise = useMemo(
    () => loadStripe(publishableKey),
    [publishableKey],
  );

  if (!publishableKey || amountCents <= 0) {
    return null;
  }

  return (
    <div className={cn(className)}>
      <Elements
        stripe={stripePromise}
        options={{
          locale,
          mode: "payment",
          amount: amountCents,
          currency: "eur",
          excludedPaymentMethodTypes: [...WOO_PAYMENTS_EXCLUDED_STRIPE_PAYMENT_METHODS],
          appearance: buildStripeCheckoutAppearance(),
        }}
      >
        <CheckoutWooPaymentsForm
          forwardedRef={ref}
          billing={billing}
          orCardLabel={orCardLabel}
          onReadyChange={onReadyChange}
          onError={onError}
          onExpressPaymentMethod={onExpressPaymentMethod}
        />
      </Elements>
    </div>
  );
});

export type { Stripe, StripeElements };
