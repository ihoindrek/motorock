import type { Locale } from "@/i18n/config";
import { localizedHref, stripLocaleFromPath } from "@/i18n/paths";

export const PRODUCT_PATH_SEGMENTS: Record<Locale, string> = {
  en: "product",
  et: "toode",
};

export const LEGACY_PRODUCT_PATH_PREFIX = "/shop/product";

export const PRODUCT_SLUG_PATH_TEMPLATES: Record<Locale, string> = {
  en: "/product/{slug}",
  et: "/toode/{slug}",
};

export function buildProductHref(slug: string, locale: Locale) {
  return `/${PRODUCT_PATH_SEGMENTS[locale]}/${slug}`;
}

export function localizedProductHref(slug: string, locale: Locale) {
  return localizedHref(locale, buildProductHref(slug, locale));
}

export function isProductPath(pathname: string) {
  const basePath = stripLocaleFromPath(pathname);

  return (
    basePath.startsWith(`${LEGACY_PRODUCT_PATH_PREFIX}/`) ||
    basePath.startsWith(`/${PRODUCT_PATH_SEGMENTS.en}/`) ||
    basePath.startsWith(`/${PRODUCT_PATH_SEGMENTS.et}/`)
  );
}

export function parseProductSlugFromPath(pathname: string) {
  const basePath = stripLocaleFromPath(pathname);
  const prefixes = [
    LEGACY_PRODUCT_PATH_PREFIX,
    `/${PRODUCT_PATH_SEGMENTS.en}`,
    `/${PRODUCT_PATH_SEGMENTS.et}`,
  ];

  for (const prefix of prefixes) {
    if (basePath.startsWith(`${prefix}/`)) {
      const slug = basePath.slice(prefix.length + 1).split("/")[0];
      return slug || null;
    }
  }

  return null;
}

export function resolveProductHrefForLocaleSwitch(
  alternates: Partial<Record<Locale, string>>,
  nextLocale: Locale,
) {
  const slug = alternates[nextLocale];

  if (!slug) {
    return null;
  }

  return localizedProductHref(slug, nextLocale);
}

export function resolveProductPathPrefixRedirect(
  basePath: string,
  locale: Locale,
): string | null {
  const canonicalPrefix = `/${PRODUCT_PATH_SEGMENTS[locale]}`;
  const alternatePrefixes = [
    LEGACY_PRODUCT_PATH_PREFIX,
    locale === "et" ? `/${PRODUCT_PATH_SEGMENTS.en}` : `/${PRODUCT_PATH_SEGMENTS.et}`,
  ];

  for (const alternatePrefix of alternatePrefixes) {
    if (basePath.startsWith(`${alternatePrefix}/`)) {
      const slug = basePath.slice(alternatePrefix.length + 1).split("/")[0];

      if (!slug) {
        return null;
      }

      return buildProductHref(slug, locale);
    }
  }

  return null;
}
