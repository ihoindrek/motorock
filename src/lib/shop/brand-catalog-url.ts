import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";
import {
  buildBrandCatalogHref,
} from "@/lib/shop/brand-url";
import type { CategoryRoute } from "@/lib/shop/category";

const MOTORCYCLE_BRAND_SLUGS = new Set([
  "brixton",
  "mutt",
  "motron",
  "malaguti",
]);

export const EQUIPMENT_BRAND_SLUGS = [
  "pando-moto",
  "holyfreedom",
  "johnny-reb",
  "bobhead",
  "motogirl",
  "makita",
] as const;

export const EQUIPMENT_BRAND_NAMES: Record<
  (typeof EQUIPMENT_BRAND_SLUGS)[number],
  string
> = {
  "pando-moto": "Pando Moto",
  holyfreedom: "Holyfreedom",
  "johnny-reb": "Johnny Reb",
  bobhead: "Bobhead",
  motogirl: "Motogirl",
  makita: "Makita",
};

export { buildBrandCatalogHref } from "@/lib/shop/brand-url";

export function resolveEquipmentBrandName(slug: string) {
  return EQUIPMENT_BRAND_NAMES[slug as (typeof EQUIPMENT_BRAND_SLUGS)[number]] ?? null;
}

export function buildEquipmentBrandRoute(
  locale: Locale,
  slug: string,
  dict: Dictionary,
): CategoryRoute | null {
  const brandName = resolveEquipmentBrandName(slug);

  if (!brandName) {
    return null;
  }

  return {
    title: brandName,
    description: dict.seo.brandDescription.replace("{brand}", brandName),
    breadcrumbs: [
      { label: dict.common.home, href: "/" },
      { label: dict.nav.equipment, href: buildEquipmentHubHref(locale) },
      { label: brandName, href: buildBrandCatalogHref(locale, slug) },
    ],
    brand: brandName,
  };
}

/** Where a brand logo or footer link should land in the storefront catalog. */
export function getBrandCatalogHref(slug: string, locale: Locale = "en"): string {
  if (MOTORCYCLE_BRAND_SLUGS.has(slug)) {
    return `/shop/motorcycles?brand=${slug}`;
  }

  if (EQUIPMENT_BRAND_SLUGS.includes(slug as (typeof EQUIPMENT_BRAND_SLUGS)[number])) {
    return buildBrandCatalogHref(locale, slug);
  }

  return buildEquipmentHubHref(locale);
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

export type { BrandRouteTree } from "@/lib/shop/brand-url";