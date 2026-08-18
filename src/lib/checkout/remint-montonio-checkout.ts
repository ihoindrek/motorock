import { needsMontonioPaymentRemint } from "@/lib/checkout/montonio-checkout";
import type { CheckoutRemintInput } from "@/lib/checkout/orchestrate-checkout.types";
import {
  createMontonioPaymentOrder,
  type MontonioCheckoutAddress,
  type MontonioPaymentLineItem,
} from "@/lib/montonio/payment-order";

export async function remintMontonioCheckoutPayment(input: CheckoutRemintInput) {
  if (!needsMontonioPaymentRemint(input.montonioOption)) {
    throw new Error("Payment method does not require Montonio remint");
  }

  const payment = await createMontonioPaymentOrder({
    orderDatabaseId: input.orderDatabaseId,
    orderNumber: input.orderNumber ?? null,
    total: input.total,
    currency: input.currency ?? "EUR",
    locale: input.locale,
    country: input.country,
    montonioOption: input.montonioOption,
    billing: input.billing as MontonioCheckoutAddress,
    shipping: input.shipping as MontonioCheckoutAddress,
    lineItems: input.lineItems as MontonioPaymentLineItem[],
  });

  return {
    redirect: payment.paymentUrl,
    uuid: payment.uuid,
    paymentMethodId: payment.paymentMethodId,
  };
}
