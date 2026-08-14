import { getWooStoreUrl } from "@/lib/storefront/url";
import { getWooInternalSecret } from "@/lib/woocommerce/internal-secret";

export type OrderReturnContext = {
  key: string;
  locale: "en" | "et";
  paymentMethod: string | null;
};

export async function fetchOrderReturnContext(
  orderId: string,
): Promise<OrderReturnContext | null> {
  const secret = getWooInternalSecret();
  if (!secret) {
    return null;
  }

  const endpoint = new URL("/wp-json/motorock/v1/thank-you-key", getWooStoreUrl());
  endpoint.searchParams.set("order", orderId);

  try {
    const response = await fetch(endpoint.toString(), {
      cache: "no-store",
      headers: {
        "X-Motorock-Internal-Secret": secret,
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      key?: string;
      locale?: string;
      paymentMethod?: string;
    };

    const key = payload.key?.trim();
    if (!key) {
      return null;
    }

    return {
      key,
      locale: payload.locale === "en" ? "en" : "et",
      paymentMethod: payload.paymentMethod?.trim() || null,
    };
  } catch {
    return null;
  }
}
