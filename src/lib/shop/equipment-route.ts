import type { Dictionary } from "@/i18n/dictionaries/en";
import { locales, type Locale } from "@/i18n/config";
import type {
  EquipmentCategoryIndex,
  WcCategoryEntry,
  WcCategoryNode,
} from "@/lib/graphql/categories";
import {
  getLocalizedCategoryDescription,
  getLocalizedCategoryName,
  getLocalizedCategoryPathSegments,
  getLocalizedCategorySlug,
  resolveCategoryPath,
  resolveLocalizedCategoryPath,
} from "@/lib/graphql/categories";
import {
  buildEquipmentCategoryHref,
  buildEquipmentHubHref,
} from "@/lib/shop/category-url";
import type { Breadcrumb, CategoryRoute } from "@/lib/shop/category";
import type { ProductGender } from "@/types/catalog-product";

export { buildEquipmentCategoryHref, buildEquipmentHubHref } from "@/lib/shop/category-url";

/** Decode slug segments and split embedded `/` (e.g. meestele%2Fkapuutsid → two segments). */
export function normalizeEquipmentSlugSegments(
  slugSegments: readonly string[],
): string[] {
  const normalized: string[] = [];

  for (const segment of slugSegments) {
    let decoded = segment;

    try {
      decoded = decodeURIComponent(segment);
    } catch {
      decoded = segment;
    }

    for (const part of decoded.split("/")) {
      const trimmed = part.trim();

      if (trimmed) {
        normalized.push(trimmed);
      }
    }
  }

  return normalized;
}

export function equipmentSlugSegmentsMatch(
  left: readonly string[],
  right: readonly string[],
) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((segment, index) => segment === right[index]);
}

export function buildEquipmentCategoryHrefFromNodes(
  chain: readonly WcCategoryNode[],
  locale: Locale,
): string {
  return buildEquipmentCategoryHref(locale, ...getLocalizedCategoryPathSegments(chain, locale));
}

export function buildEquipmentRootCategoryHref(
  node: Pick<WcCategoryNode, "slug" | "languageCode" | "translations"> | null | undefined,
  wcSlug: string,
  locale: Locale,
) {
  const segment = node ? getLocalizedCategorySlug(node, locale) : wcSlug;
  return buildEquipmentCategoryHref(locale, segment);
}

export function resolveEquipmentCategoryChain(
  slugSegments: readonly string[],
  index: EquipmentCategoryIndex,
  locale: Locale,
): WcCategoryEntry[] | null {
  const resolved =
    resolveLocalizedCategoryPath(index, slugSegments, locale) ??
    resolveCategoryPath(index, slugSegments);

  if (resolved) {
    return resolved;
  }

  // The locale switcher keeps the slug and only swaps the locale prefix
  // (e.g. /et/tootekategooria/kiivrid -> /en/.../kiivrid). Try the other
  // locales' slugs so the caller can redirect to the canonical URL instead
  // of returning a 404.
  for (const other of locales) {
    if (other === locale) {
      continue;
    }

    const chain = resolveLocalizedCategoryPath(index, slugSegments, other);

    if (chain) {
      return chain;
    }
  }

  return null;
}

export function getCanonicalEquipmentSlugSegments(
  chain: readonly WcCategoryEntry[],
  locale: Locale,
): string[] {
  return getLocalizedCategoryPathSegments(chain, locale);
}

function genderFromRootSlug(slug: string): ProductGender | undefined {
  if (slug === "for-men") {
    return "men";
  }

  if (slug === "for-women") {
    return "women";
  }

  return undefined;
}

function buildDescription(name: string, locale: Locale) {
  if (locale === "et") {
    return `${name} — sõiduvarustus Motorock.eu poes.`;
  }

  return `${name} — riding gear and equipment from Motorock.eu.`;
}

function buildBreadcrumbs(
  chain: readonly WcCategoryEntry[],
  locale: Locale,
  dict: Dictionary,
): Breadcrumb[] {
  const breadcrumbs: Breadcrumb[] = [
    { label: dict.common.home, href: "/" },
    { label: dict.nav.equipment, href: buildEquipmentHubHref(locale) },
  ];

  for (let index = 0; index < chain.length; index += 1) {
    const node = chain[index];
    const path = chain.slice(0, index + 1);

    breadcrumbs.push({
      label: getLocalizedCategoryName(node, locale),
      href: buildEquipmentCategoryHrefFromNodes(path, locale),
    });
  }

  return breadcrumbs;
}

function resolveProtectionRoute(locale: Locale, dict: Dictionary): CategoryRoute {
  return {
    title: locale === "et" ? "Kaitse ja turvalisus" : "Protection & safety",
    description:
      locale === "et"
        ? "Kiivrid, prillid ja CE-sertifikaadiga kaitse igaks sõiduks."
        : "Helmets, goggles and CE-rated protection for every ride.",
    breadcrumbs: [
      { label: dict.common.home, href: "/" },
      { label: dict.nav.equipment, href: buildEquipmentHubHref(locale) },
      {
        label: locale === "et" ? "Kaitse" : "Protection",
        href: buildEquipmentCategoryHref(locale, "protection"),
      },
    ],
    protectionOnly: true,
  };
}

export function resolveEquipmentRoute(
  slugSegments: string[],
  index: EquipmentCategoryIndex | null,
  locale: Locale,
  dict: Dictionary,
): CategoryRoute | null {
  if (slugSegments.length === 0) {
    return {
      title: dict.nav.equipment,
      description:
        locale === "et"
          ? "Premium sõiduvarustus meestele ja naistele — jakid, kaitse ja varustus."
          : "Premium riding gear for men and women — jackets, protection, and rebel essentials.",
      breadcrumbs: [
        { label: dict.common.home, href: "/" },
        { label: dict.nav.equipment, href: buildEquipmentHubHref(locale) },
      ],
    };
  }

  if (slugSegments[0] === "protection") {
    return resolveProtectionRoute(locale, dict);
  }

  if (slugSegments[0] === "armour") {
    return resolveEquipmentRoute(["accessories", "safety"], index, locale, dict);
  }

  if (!index) {
    return null;
  }

  const chain = resolveEquipmentCategoryChain(slugSegments, index, locale);

  if (!chain) {
    return null;
  }

  const current = chain[chain.length - 1];
  const title = getLocalizedCategoryName(current, locale);
  const rootSlug = chain[0]?.slug;
  const gender = rootSlug ? genderFromRootSlug(rootSlug) : undefined;
  const description =
    getLocalizedCategoryDescription(current, locale) ||
    buildDescription(title, locale);

  return {
    title,
    description,
    breadcrumbs: buildBreadcrumbs(chain, locale, dict),
    wcCategorySlug: current.slug,
    wcCategoryPath: chain.map((node) => node.slug),
    gender,
    accessoriesOnly: rootSlug === "accessories" && chain.length === 1,
  };
}
