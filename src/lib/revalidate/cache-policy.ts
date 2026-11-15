/**
 * Storefront ISR / fetch cache policy.
 * Raised from 300s to cut Vercel ISR write + Fluid rebuild cost; Woo webhooks
 * still purge changed products immediately.
 *
 * Keep page `export const revalidate = 1800` in sync — Next.js requires a
 * numeric literal for segment config (imported constants fail the build).
 */
export const STOREFRONT_REVALIDATE_SECONDS = 1800;

/** Coalesce catalog-wide tag purges during import/webhook bursts. */
export const CATALOG_REVALIDATE_DEBOUNCE_MS = 5 * 60_000;
