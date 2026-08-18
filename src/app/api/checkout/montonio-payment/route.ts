import { NextResponse } from "next/server";
import { remintMontonioCheckoutPayment } from "@/lib/checkout/remint-montonio-checkout";
import type { CheckoutRemintInput } from "@/lib/checkout/orchestrate-checkout.types";
import { needsMontonioPaymentRemint } from "@/lib/checkout/montonio-checkout";
import type { MontonioPaymentOption } from "@/types/montonio-payment";
import type { MontonioCheckoutAddress, MontonioPaymentLineItem } from "@/lib/montonio/payment-order";

type RequestBody = {
  orderDatabaseId?: number;
  orderNumber?: string | null;
  total?: number;
  currency?: string;
  locale?: "en" | "et";
  country?: string;
  montonioOption?: MontonioPaymentOption;
  billing?: MontonioCheckoutAddress;
  shipping?: MontonioCheckoutAddress;
  lineItems?: MontonioPaymentLineItem[];
};

export async function POST(request: Request) {
  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    orderDatabaseId,
    orderNumber,
    total,
    currency,
    locale,
    country,
    montonioOption,
    billing,
    shipping,
    lineItems,
  } = body;

  if (
    !orderDatabaseId ||
    !total ||
    total <= 0 ||
    !montonioOption ||
    !billing ||
    !shipping ||
    !lineItems?.length
  ) {
    return NextResponse.json(
      { error: "Missing checkout payment details" },
      { status: 400 },
    );
  }

  if (!needsMontonioPaymentRemint(montonioOption)) {
    return NextResponse.json(
      { error: "Payment method does not require Montonio remint" },
      { status: 400 },
    );
  }

  try {
    const remintInput: CheckoutRemintInput = {
      orderDatabaseId,
      orderNumber: orderNumber ?? null,
      total,
      currency,
      locale: locale ?? "et",
      country: country ?? billing.country,
      montonioOption,
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
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        email: shipping.email ?? billing.email,
        phone: shipping.phone ?? billing.phone,
        address1: shipping.address1,
        city: shipping.city,
        postcode: shipping.postcode,
        country: shipping.country,
      },
      lineItems: lineItems.map((item) => ({
        name: item.name,
        finalPrice: item.finalPrice,
        quantity: item.quantity,
      })),
    };

    const payment = await remintMontonioCheckoutPayment(remintInput);

    return NextResponse.json({
      redirect: payment.redirect,
      uuid: payment.uuid,
      paymentMethodId: payment.paymentMethodId,
    });
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Could not create Montonio payment";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
