/** WooCommerce / WordPress backend (headless API + media). */
export const DEFAULT_WOO_STORE_URL = "https://shop.motorock.eu";

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
    DEFAULT_WOO_STORE_URL
  );
}

export function getWooGraphqlUrl() {
  return (
    process.env.WOOCOMMERCE_GRAPHQL_URL?.replace(/\/$/, "") ??
    `${DEFAULT_WOO_STORE_URL}/graphql`
  );
}

export function montonioReturnUrl(input: {
  gatewayId: string;
  locale?: "en" | "et";
}) {
  const params = new URLSearchParams();

  if (input.gatewayId) {
    params.set("gateway", input.gatewayId);
  }

  if (input.locale) {
    params.set("locale", input.locale);
  }

  const query = params.toString();

  return `${getStorefrontUrl()}/order/payment-return${query ? `?${query}` : ""}`;
}
