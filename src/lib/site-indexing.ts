/** Set SITE_INDEXING=true when the storefront is ready for search engines. */
export function isSiteIndexable(): boolean {
  return process.env.SITE_INDEXING === "true";
}
