import { getWooStoreUrl } from "@/lib/storefront/url";
import { getWooInternalSecret } from "@/lib/woocommerce/internal-secret";

export async function fetchOrderThankYouKey(orderId: string) {
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

    const payload = (await response.json()) as { key?: string };
    return payload.key?.trim() || null;
  } catch {
    return null;
  }
}
