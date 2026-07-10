/** Shared secret for trusted storefront → WooCommerce REST calls. */
export function getWooInternalSecret() {
  return (
    process.env.MOTOROCK_INTERNAL_SECRET?.trim() ||
    process.env.WOOCOMMERCE_WEBHOOK_SECRET?.trim() ||
    process.env.REVALIDATE_SECRET?.trim() ||
    null
  );
}
