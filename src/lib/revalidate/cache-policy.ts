/**
 * Storefront ISR / fetch cache policy.
 * Raised from 300s to cut Vercel ISR write + Fluid rebuild cost; Woo webhooks
 * still purge changed products immediately.
 */
export const STOREFRONT_REVALIDATE_SECONDS = 1800;

/** Coalesce catalog-wide tag purges during import/webhook bursts. */
export const CATALOG_REVALIDATE_DEBOUNCE_MS = 5 * 60_000;
