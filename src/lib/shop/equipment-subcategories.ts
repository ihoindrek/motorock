import type { Locale } from "@/i18n/config";
import type { EquipmentCategoryIndex, WcCategoryEntry } from "@/lib/graphql/categories";
import {
  categoryHasProducts,
  getCategoryImage,
  getLocalizedCategoryName,
} from "@/lib/graphql/categories";
import type { CategoryRoute } from "@/lib/shop/category";
import {
  buildEquipmentCategoryHrefFromNodes,
  buildEquipmentRootCategoryHref,
} from "@/lib/shop/equipment-route";
import { HELMET_WC_SLUGS } from "@/lib/shop/wc-categories";

const EQUIPMENT_BRANCH_ROOTS = new Set(["for-men", "for-women", "accessories"]);

const DEFAULT_SUBCATEGORY_IMAGE = "/JRH10015_L23.webp";

export type EquipmentSubcategory = {
  wcSlug: string;
  title: string;
  href: string;
  image: string;
  imageAlt: string;
  productCount: number;
};

export function isEquipmentBranchRoot(route: CategoryRoute): boolean {
  const rootSlug = route.wcCategoryPath?.[0];

  return (
    route.wcCategoryPath?.length === 1 &&
    rootSlug != null &&
    EQUIPMENT_BRANCH_ROOTS.has(rootSlug)
  );
}

function sortSubcategories(left: WcCategoryEntry, right: WcCategoryEntry) {
  const leftCount = left.count ?? 0;
  const rightCount = right.count ?? 0;

  if (rightCount !== leftCount) {
    return rightCount - leftCount;
  }

  return left.name.localeCompare(right.name);
}

function mapChildSubcategory(
  root: WcCategoryEntry,
  child: WcCategoryEntry,
  locale: Locale,
): EquipmentSubcategory {
  const title = getLocalizedCategoryName(child, locale);
  const { url, alt } = getCategoryImage(child, DEFAULT_SUBCATEGORY_IMAGE);

  return {
    wcSlug: child.slug,
    title,
    href: buildEquipmentCategoryHrefFromNodes([root, child], locale),
    image: url,
    imageAlt: alt,
    productCount: child.count ?? 0,
  };
}

function mapHelmetsRootSubcategory(
  helmets: WcCategoryEntry,
  locale: Locale,
): EquipmentSubcategory {
  const title = getLocalizedCategoryName(helmets, locale);
  const { url, alt } = getCategoryImage(helmets, DEFAULT_SUBCATEGORY_IMAGE);

  return {
    wcSlug: helmets.slug,
    title,
    href: buildEquipmentRootCategoryHref(helmets, "helmets", locale),
    image: url,
    imageAlt: alt,
    productCount: helmets.count ?? 0,
  };
}

export function buildEquipmentSubcategories(
  route: CategoryRoute,
  index: EquipmentCategoryIndex,
  locale: Locale,
): EquipmentSubcategory[] {
  const rootSlug = route.wcCategoryPath?.[0];

  if (!rootSlug || !isEquipmentBranchRoot(route)) {
    return [];
  }

  const root = index.nodes.get(rootSlug);

  if (!root) {
    return [];
  }

  const subcategories = [...index.nodes.values()]
    .filter((node) => node.parentSlug === rootSlug)
    .filter((node) => rootSlug !== "accessories" || !HELMET_WC_SLUGS.has(node.slug))
    .filter(categoryHasProducts)
    .sort(sortSubcategories)
    .map((child) => mapChildSubcategory(root, child, locale));

  if (rootSlug !== "accessories") {
    return subcategories;
  }

  const helmets = index.nodes.get("helmets");

  if (!helmets || !categoryHasProducts(helmets)) {
    return subcategories;
  }

  const helmetSubcategory = mapHelmetsRootSubcategory(helmets, locale);

  return [
    helmetSubcategory,
    ...subcategories.filter((subcategory) => subcategory.wcSlug !== helmets.slug),
  ];
}
