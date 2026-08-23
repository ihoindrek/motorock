import { getWooInternalSecret } from "@/lib/woocommerce/internal-secret";
import { getWooStoreUrl } from "@/lib/storefront/url";

export async function prepareMontonioPaymentOrder(input: {
  orderDatabaseId: number;
  gateway?: string | null;
}) {
  const secret = getWooInternalSecret();
  if (!secret) {
    return null;
  }

  const endpoint = new URL(
    "/wp-json/motorock/v1/prepare-montonio-payment",
    getWooStoreUrl(),
  );

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-motorock-internal-secret": secret,
    },
    body: JSON.stringify({
      order: input.orderDatabaseId,
      ...(input.gateway ? { gateway: input.gateway } : {}),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Could not prepare Montonio payment on WooCommerce (${response.status}): ${detail.slice(0, 240)}`,
    );
  }

  return (await response.json()) as {
    updated?: boolean;
    paymentMethod?: string;
  };
}
