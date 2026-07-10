import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";
import {
  EQUIPMENT_ROOT_SLUGS,
  getLocalizedCategoryDescription,
  getLocalizedCategoryName,
  getLocalizedCategorySlug,
  type EquipmentCategoryIndex,
  type WcCategoryEntry,
} from "@/lib/graphql/categories";
import type { CategoryRoute } from "@/lib/shop/category";
import { mapWcSlugToCategory } from "@/lib/shop/wc-categories";
import { TOOLS_WC_SLUG } from "@/lib/shop/wc-categories";

export function isStandaloneShopCategory(
  node: WcCategoryEntry,
  index: EquipmentCategoryIndex,
): boolean {
  if ((EQUIPMENT_ROOT_SLUGS as readonly string[]).includes(node.slug)) {
    return false;
  }

  let parentSlug = node.parentSlug;

  while (parentSlug) {
    if ((EQUIPMENT_ROOT_SLUGS as readonly string[]).includes(parentSlug)) {
      return false;
    }

    parentSlug = index.nodes.get(parentSlug)?.parentSlug ?? null;
  }

  return true;
}

export function buildShopCategoryHref(
  node: Pick<WcCategoryEntry, "slug" | "languageCode" | "translations">,
  locale: Locale,
) {
  return `/shop/${getLocalizedCategorySlug(node, locale)}`;
}

export function resolveShopCategoryRoute(
  node: WcCategoryEntry,
  locale: Locale,
  dict: Dictionary,
): CategoryRoute {
  const title = getLocalizedCategoryName(node, locale);
  const pathSlug = getLocalizedCategorySlug(node, locale);
  const mappedCategory = mapWcSlugToCategory(node.slug);
  const description =
    getLocalizedCategoryDescription(node, locale) ||
    (locale === "et"
      ? `${title} — Motorock.eu poes.`
      : `${title} — from Motorock.eu.`);

  return {
    title,
    description,
    breadcrumbs: [
      { label: dict.common.home, href: "/" },
      { label: title, href: buildShopCategoryHref(node, locale) },
    ],
    wcCategorySlug: node.slug,
    category: mappedCategory,
  };
}

/** Fallback when the category node has not been loaded yet. */
export function getToolsCategoryPathSlug(locale: Locale) {
  return locale === "et" ? "tooriistad-ja-hooldus" : "tools-maintenance";
}

export function buildToolsCategoryHref(locale: Locale) {
  return `/shop/${getToolsCategoryPathSlug(locale)}`;
}

export function isToolsWcSlug(slug: string) {
  return slug === TOOLS_WC_SLUG || slug === getToolsCategoryPathSlug("et");
}
