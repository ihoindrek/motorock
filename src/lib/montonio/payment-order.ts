import type { MontonioPaymentOption } from "@/types/montonio-payment";
import { montonioOptionLabel } from "@/types/montonio-payment";
import { getMontonioConfig } from "@/lib/montonio/config";
import { createMontonioSignedJwt } from "@/lib/montonio/payment-jwt";
import { getWooStoreUrl, montonioReturnUrl } from "@/lib/storefront/url";

export type MontonioCheckoutAddress = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  region?: string;
  postcode: string;
  country: string;
};

export type MontonioPaymentLineItem = {
  name: string;
  finalPrice: number;
  quantity: number;
};

const GATEWAY_BY_KIND: Record<MontonioPaymentOption["kind"], string> = {
  bank: "wc_montonio_payments",
  card: "wc_montonio_card",
  blik: "wc_montonio_blik",
  bnpl: "wc_montonio_bnpl",
  hirePurchase: "wc_montonio_hire_purchase",
};

function getStoreUrl() {
  return getWooStoreUrl();
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function resolveMontonioGatewayForOption(option: MontonioPaymentOption) {
  return GATEWAY_BY_KIND[option.kind] ?? "wc_montonio_payments";
}

function buildMethodOptions(
  option: MontonioPaymentOption,
  country?: string,
): Record<string, string> | null {
  if (option.kind !== "bank") {
    return null;
  }

  const methodOptions: Record<string, string> = {};

  if (option.code) {
    methodOptions.preferredProvider = option.code;
  }

  if (country) {
    methodOptions.preferredCountry = country.toUpperCase();
  }

  return Object.keys(methodOptions).length > 0 ? methodOptions : null;
}

export async function createMontonioPaymentOrder(input: {
  orderDatabaseId: number;
  orderNumber: string | null;
  total: number;
  currency?: string;
  locale?: "en" | "et";
  montonioOption: MontonioPaymentOption;
  billing: MontonioCheckoutAddress;
  shipping: MontonioCheckoutAddress;
  lineItems: MontonioPaymentLineItem[];
  country?: string;
}) {
  const config = getMontonioConfig();
  if (!config.isConfigured || !config.accessKey || !config.secretKey) {
    throw new Error("Montonio API keys are not configured.");
  }

  const paymentMethodId = resolveMontonioGatewayForOption(input.montonioOption);
  const storeUrl = getStoreUrl();
  const grandTotal = roundMoney(input.total);
  const currency = input.currency ?? "EUR";
  const locale = input.locale === "et" ? "et" : "en";
  const methodDisplay = montonioOptionLabel(input.montonioOption, locale);
  const methodOptions = buildMethodOptions(
    input.montonioOption,
    input.country ?? input.billing.country,
  );

  const orderData = {
    accessKey: config.accessKey,
    merchantReference: String(input.orderDatabaseId),
    merchantReferenceDisplay:
      input.orderNumber ?? String(input.orderDatabaseId),
    notificationUrl: `${storeUrl}/?wc-api=${paymentMethodId}_notification`,
    returnUrl: montonioReturnUrl({
      gatewayId: paymentMethodId,
      locale: input.locale === "et" ? "et" : "en",
    }),
    grandTotal,
    currency,
    locale,
    billingAddress: {
      firstName: input.billing.firstName,
      lastName: input.billing.lastName,
      email: input.billing.email ?? "",
      phoneNumber: input.billing.phone ?? "",
      addressLine1: input.billing.address1,
      addressLine2: input.billing.address2 ?? "",
      locality: input.billing.city,
      region: input.billing.region ?? "",
      postalCode: input.billing.postcode,
      country: input.billing.country.toUpperCase(),
    },
    shippingAddress: {
      firstName: input.shipping.firstName,
      lastName: input.shipping.lastName,
      email: input.billing.email ?? "",
      phoneNumber: input.billing.phone ?? "",
      addressLine1: input.shipping.address1,
      addressLine2: input.shipping.address2 ?? "",
      locality: input.shipping.city,
      region: input.shipping.region ?? "",
      postalCode: input.shipping.postcode,
      country: input.shipping.country.toUpperCase(),
    },
    lineItems: input.lineItems.map((item) => ({
      name: item.name,
      finalPrice: roundMoney(item.finalPrice),
      quantity: item.quantity,
    })),
    payment: {
      method: input.montonioOption.systemName,
      methodDisplay,
      amount: grandTotal,
      currency,
      methodOptions,
    },
  };

  const token = createMontonioSignedJwt(orderData, config.secretKey);
  const response = await fetch(`${config.paymentsApiBase}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ data: token }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Montonio payment order failed (${response.status}): ${detail.slice(0, 240)}`,
    );
  }

  const payload = (await response.json()) as {
    uuid?: string;
    paymentUrl?: string;
  };

  if (!payload.paymentUrl) {
    throw new Error("Montonio did not return a payment URL.");
  }

  return {
    paymentUrl: payload.paymentUrl,
    uuid: payload.uuid ?? null,
    paymentMethodId,
  };
}
