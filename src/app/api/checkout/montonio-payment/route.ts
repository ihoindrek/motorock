import { NextResponse } from "next/server";
import type { MontonioPaymentOption } from "@/types/montonio-payment";
import {
  createMontonioPaymentOrder,
  type MontonioCheckoutAddress,
  type MontonioPaymentLineItem,
} from "@/lib/montonio/payment-order";
import { needsMontonioPaymentRemint } from "@/lib/checkout/montonio-checkout";

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
    const payment = await createMontonioPaymentOrder({
      orderDatabaseId,
      orderNumber: orderNumber ?? null,
      total,
      currency,
      locale,
      country,
      montonioOption,
      billing,
      shipping,
      lineItems,
    });

    return NextResponse.json({
      redirect: payment.paymentUrl,
      uuid: payment.uuid,
      paymentMethodId: payment.paymentMethodId,
    });
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Could not create Montonio payment";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
