/**
 * Storefront routes that must never be indexed or listed in sitemap.xml.
 * Kept in one place for robots.txt, metadata, and tests.
 */
export const NON_INDEXABLE_PATH_PREFIXES = [
  "/api/",
  "/order/payment-return",
  "/*/cart",
  "/*/checkout",
  "/*/search",
  "/*/wishlist",
  "/*/order/thank-you",
] as const;

/** Path without locale prefix, e.g. `/cart`, `/search?q=`. */
export function isNonIndexablePath(pathname: string) {
  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  const segments = path.split("/").filter(Boolean);

  if (path === "/order/payment-return" || path.startsWith("/order/payment-return/")) {
    return true;
  }

  if (segments[0] === "api") {
    return true;
  }

  const leaf = segments[segments.length - 1];
  if (
    leaf === "cart" ||
    leaf === "checkout" ||
    leaf === "search" ||
    leaf === "wishlist"
  ) {
    return true;
  }

  if (segments.slice(-2).join("/") === "order/thank-you") {
    return true;
  }

  return false;
}
