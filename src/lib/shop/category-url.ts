import type { Locale } from "@/i18n/config";
import { localizedHref, stripLocaleFromPath } from "@/i18n/paths";

export const EQUIPMENT_HUB_PATH: Record<Locale, string> = {
  en: "/shop/equipment",
  et: "/tootekategooria",
};

export const LEGACY_EQUIPMENT_HUB_PATH = "/shop/equipment";

export function buildEquipmentHubHref(locale: Locale) {
  return EQUIPMENT_HUB_PATH[locale];
}

export function buildEquipmentCategoryHref(locale: Locale, ...slugSegments: string[]) {
  if (slugSegments.length === 0) {
    return buildEquipmentHubHref(locale);
  }

  return `${EQUIPMENT_HUB_PATH[locale]}/${slugSegments.join("/")}`;
}

export function localizedEquipmentCategoryHref(locale: Locale, ...slugSegments: string[]) {
  return localizedHref(locale, buildEquipmentCategoryHref(locale, ...slugSegments));
}

export function isEquipmentCategoryPath(pathname: string) {
  const basePath = stripLocaleFromPath(pathname);

  return (
    basePath === EQUIPMENT_HUB_PATH.en ||
    basePath.startsWith(`${EQUIPMENT_HUB_PATH.en}/`) ||
    basePath === EQUIPMENT_HUB_PATH.et ||
    basePath.startsWith(`${EQUIPMENT_HUB_PATH.et}/`)
  );
}

export function resolveEquipmentPathPrefixRedirect(
  basePath: string,
  locale: Locale,
): string | null {
  const canonicalPrefix = EQUIPMENT_HUB_PATH[locale];
  const alternatePrefix = locale === "et" ? EQUIPMENT_HUB_PATH.en : EQUIPMENT_HUB_PATH.et;

  if (basePath === alternatePrefix) {
    return canonicalPrefix;
  }

  if (basePath.startsWith(`${alternatePrefix}/`)) {
    return `${canonicalPrefix}${basePath.slice(alternatePrefix.length)}`;
  }

  return null;
}

export type EquipmentRouteTree = "en" | "et";

export function equipmentRouteTreeForLocale(locale: Locale): EquipmentRouteTree {
  return locale === "et" ? "et" : "en";
}
