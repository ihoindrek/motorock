/** Set NEXT_PUBLIC_CHECKOUT_LIVE=true when real WooCommerce/Montonio orders are allowed. */
export function isLiveCheckoutEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CHECKOUT_LIVE === "true";
}

/** Preview/test checkout: shipping + payment UI work, but submit does not create a Woo order. */
export function isCheckoutPreviewMode(): boolean {
  return !isLiveCheckoutEnabled();
}
