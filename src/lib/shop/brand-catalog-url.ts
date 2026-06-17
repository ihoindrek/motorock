const MOTORCYCLE_BRAND_SLUGS = new Set([
  "brixton",
  "mutt",
  "motron",
  "malaguti",
]);

const EQUIPMENT_BRAND_SLUGS = new Set([
  "pando-moto",
  "holyfreedom",
  "johnny-reb",
  "bobhead",
  "motogirl",
  "makita",
]);

/** Where a brand logo or footer link should land in the storefront catalog. */
export function getBrandCatalogHref(slug: string): string {
  if (MOTORCYCLE_BRAND_SLUGS.has(slug)) {
    return `/shop/motorcycles?brand=${slug}`;
  }

  if (EQUIPMENT_BRAND_SLUGS.has(slug)) {
    return `/shop/brands/${slug}`;
  }

  return "/shop/equipment";
}

export function resolveMotorcycleBrandFromSlug(
  slug: string | undefined,
  brandNames: readonly string[],
): string | undefined {
  if (!slug) {
    return undefined;
  }

  const normalized = slug.toLowerCase().replace(/-/g, " ");

  return brandNames.find(
    (name) => name.toLowerCase().replace(/-/g, " ") === normalized,
  );
}
