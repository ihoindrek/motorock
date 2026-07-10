/** Public Next.js storefront origin (customer-facing). */
export function getStorefrontUrl() {
  const configured = process.env.NEXT_PUBLIC_STOREFRONT_URL?.replace(/\/$/, "");
  if (configured) {
    return configured;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

/** WooCommerce / WordPress backend origin (wc-api, webhooks, REST). */
export function getWooStoreUrl() {
  return (
    process.env.WOOCOMMERCE_STORE_URL?.replace(/\/$/, "") ??
    "https://motorock.eu"
  );
}

export function montonioReturnUrl(input: {
  gatewayId: string;
  locale?: "en" | "et";
}) {
  const params = new URLSearchParams({
    gateway: input.gatewayId,
    locale: input.locale ?? "et",
  });

  return `${getStorefrontUrl()}/api/checkout/montonio-return?${params}`;
}
