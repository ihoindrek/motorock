/**
 * Fallback when ACF field is not set yet.
 * Woo: Products → edit → ACF "Motorock toode" → "Praegu salongis".
 * "Uus" badge: automatic for 30 days after Woo publish date (see NEW_PRODUCT_DAYS).
 */
export const SHOWROOM_AVAILABLE_SLUGS = new Set<string>([
  "brixton-sunray-125",
]);
