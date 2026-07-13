import type { Locale } from "@/i18n/config";
import { stripLocaleFromPath } from "@/i18n/paths";

export const BRAND_PATH_PREFIX: Record<Locale, string> = {
  en: "/brand",
  et: "/brandid",
};

export const LEGACY_BRAND_PATH_PREFIX = "/shop/brands";

/** Old WordPress brand archive slugs → canonical storefront slugs. */
const LEGACY_BRAND_SLUG_ALIASES: Record<string, string> = {
  pando: "pando-moto",
};

export function buildBrandCatalogHref(locale: Locale, slug: string) {
  return `${BRAND_PATH_PREFIX[locale]}/${slug}`;
}

export function isBrandCatalogPath(pathname: string) {
  const basePath = stripLocaleFromPath(pathname);

  return (
    basePath === BRAND_PATH_PREFIX.en ||
    basePath.startsWith(`${BRAND_PATH_PREFIX.en}/`) ||
    basePath === BRAND_PATH_PREFIX.et ||
    basePath.startsWith(`${BRAND_PATH_PREFIX.et}/`) ||
    basePath === LEGACY_BRAND_PATH_PREFIX ||
    basePath.startsWith(`${LEGACY_BRAND_PATH_PREFIX}/`)
  );
}

export function parseBrandSlugFromPath(pathname: string) {
  const basePath = stripLocaleFromPath(pathname);
  const prefixes = [
    LEGACY_BRAND_PATH_PREFIX,
    BRAND_PATH_PREFIX.en,
    BRAND_PATH_PREFIX.et,
  ];

  for (const prefix of prefixes) {
    if (basePath === prefix) {
      return null;
    }

    if (basePath.startsWith(`${prefix}/`)) {
      const slug = basePath.slice(prefix.length + 1).split("/")[0];
      return slug || null;
    }
  }

  return null;
}

export function resolveLegacyBrandSlugRedirect(
  basePath: string,
  locale: Locale,
): string | null {
  const prefixes = [
    LEGACY_BRAND_PATH_PREFIX,
    BRAND_PATH_PREFIX.en,
    BRAND_PATH_PREFIX.et,
  ];

  for (const prefix of prefixes) {
    if (!basePath.startsWith(`${prefix}/`)) {
      continue;
    }

    const slug = basePath.slice(prefix.length + 1).split("/")[0];
    const canonicalSlug = LEGACY_BRAND_SLUG_ALIASES[slug];

    if (!canonicalSlug) {
      return null;
    }

    const target = buildBrandCatalogHref(locale, canonicalSlug);
    return basePath === target ? null : target;
  }

  return null;
}

export function resolveBrandPathPrefixRedirect(
  basePath: string,
  locale: Locale,
): string | null {
  const canonicalPrefix = BRAND_PATH_PREFIX[locale];
  const alternatePrefixes = [
    LEGACY_BRAND_PATH_PREFIX,
    locale === "et" ? BRAND_PATH_PREFIX.en : BRAND_PATH_PREFIX.et,
  ];

  for (const alternatePrefix of alternatePrefixes) {
    if (basePath === alternatePrefix) {
      return canonicalPrefix;
    }

    if (basePath.startsWith(`${alternatePrefix}/`)) {
      const slug = basePath.slice(alternatePrefix.length + 1).split("/")[0];

      if (!slug) {
        return canonicalPrefix;
      }

      return buildBrandCatalogHref(locale, slug);
    }
  }

  return null;
}

export type BrandRouteTree = "en" | "et";

export function brandRouteTreeForLocale(locale: Locale): BrandRouteTree {
  return locale === "et" ? "et" : "en";
}
