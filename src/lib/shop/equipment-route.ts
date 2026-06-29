import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";
import type { EquipmentCategoryIndex, WcCategoryEntry } from "@/lib/graphql/categories";
import {
  getLocalizedCategoryName,
  resolveCategoryPath,
} from "@/lib/graphql/categories";
import type { Breadcrumb, CategoryRoute } from "@/lib/shop/category";
import { mapWcSlugToCategory } from "@/lib/shop/wc-categories";
import type { ProductGender } from "@/types/catalog-product";

export function buildEquipmentCategoryHref(...slugSegments: string[]) {
  if (slugSegments.length === 0) {
    return "/shop/equipment";
  }

  return `/shop/equipment/${slugSegments.join("/")}`;
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
    return `${name} — sõiduriided ja varustus Motorock.eu poes.`;
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
    { label: dict.nav.equipment, href: buildEquipmentCategoryHref() },
  ];

  for (let index = 0; index < chain.length; index += 1) {
    const node = chain[index];
    const path = chain.slice(0, index + 1).map((entry) => entry.slug);

    breadcrumbs.push({
      label: getLocalizedCategoryName(node, locale),
      href: buildEquipmentCategoryHref(...path),
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
      { label: dict.nav.equipment, href: buildEquipmentCategoryHref() },
      {
        label: locale === "et" ? "Kaitse" : "Protection",
        href: buildEquipmentCategoryHref("protection"),
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
          ? "Premium sõiduriided meestele ja naistele — jakid, kaitse ja varustus."
          : "Premium riding gear for men and women — jackets, protection, and rebel essentials.",
      breadcrumbs: [
        { label: dict.common.home, href: "/" },
        { label: dict.nav.equipment, href: buildEquipmentCategoryHref() },
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

  const chain = resolveCategoryPath(index, slugSegments);

  if (!chain) {
    return null;
  }

  const current = chain[chain.length - 1];
  const title = getLocalizedCategoryName(current, locale);
  const rootSlug = chain[0]?.slug;
  const gender = rootSlug ? genderFromRootSlug(rootSlug) : undefined;
  const mappedCategory = mapWcSlugToCategory(current.slug);

  return {
    title,
    description: buildDescription(title, locale),
    breadcrumbs: buildBreadcrumbs(chain, locale, dict),
    wcCategorySlug: current.slug,
    wcCategoryPath: chain.map((node) => node.slug),
    gender,
    category: mappedCategory,
    accessoriesOnly: rootSlug === "accessories" && chain.length === 1,
  };
}

export function productMatchesRouteCategory(
  wcCategorySlugs: readonly string[] | undefined,
  route: CategoryRoute,
) {
  if (!route.wcCategorySlug || !wcCategorySlugs?.length) {
    return true;
  }

  return wcCategorySlugs.includes(route.wcCategorySlug);
}
