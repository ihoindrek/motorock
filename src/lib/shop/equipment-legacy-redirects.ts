import type { ProductCategory } from "@/types/catalog-product";
import { CATEGORY_TO_WC_SLUG } from "@/lib/shop/wc-categories";
import { buildEquipmentCategoryHref } from "@/lib/shop/category-url";

function normalizeEquipmentPath(pathname: string) {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
}

function redirectUnlessSame(pathname: string, target: string): string | null {
  return normalizeEquipmentPath(pathname) === normalizeEquipmentPath(target)
    ? null
    : target;
}

const LEGACY_GENDER_SEGMENTS: Record<string, "for-men" | "for-women"> = {
  men: "for-men",
  women: "for-women",
};

const WC_ROOT_SLUGS = new Set(["for-men", "for-women", "accessories", "helmets"]);

export const LEGACY_TOP_LEVEL_CATEGORY_REDIRECTS: Partial<
  Record<ProductCategory, string>
> = {
  jackets: buildEquipmentCategoryHref("en", "for-men", "jackets-and-tags"),
  vests: buildEquipmentCategoryHref("en", "for-men", "vests-2"),
  pants: buildEquipmentCategoryHref("en", "for-men", "mens-pants"),
  gloves: buildEquipmentCategoryHref("en", "for-men", "gloves"),
  footwear: buildEquipmentCategoryHref("en", "for-men", "footwear"),
  hoodies: buildEquipmentCategoryHref("en", "for-men", "sweaters"),
  "t-shirts": buildEquipmentCategoryHref("en", "for-men", "t-shirts"),
  "base-layers": buildEquipmentCategoryHref("en", "for-men", "base-layer-warm-underwear"),
  helmets: buildEquipmentCategoryHref("en", "helmets"),
  "helmet-accessories": buildEquipmentCategoryHref("en", "helmets", "helmet-accessories"),
  goggles: buildEquipmentCategoryHref("en", "accessories", "goggles"),
  headwear: buildEquipmentCategoryHref("en", "accessories", "headwear"),
  bags: buildEquipmentCategoryHref("en", "accessories", "bags-backpacks"),
  belts: buildEquipmentCategoryHref("en", "accessories", "belts"),
  jewelry: buildEquipmentCategoryHref("en", "accessories", "jewelry"),
  scarves: buildEquipmentCategoryHref("en", "accessories", "scarves-tubulars"),
  socks: buildEquipmentCategoryHref("en", "accessories", "socks"),
  safety: buildEquipmentCategoryHref("en", "accessories", "safety"),
  accessories: buildEquipmentCategoryHref("en", "accessories", "small-accessories"),
};

/**
 * Maps legacy `/shop/equipment/men/jackets` paths to Woo slug URLs.
 * Returns a pathname without locale prefix.
 */
export function resolveLegacyEquipmentRedirect(pathname: string): string | null {
  if (!pathname.startsWith("/shop/equipment")) {
    return null;
  }

  const remainder = pathname.slice("/shop/equipment".length);
  const segments = remainder.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  if (segments[0] === "protection" || segments[0] === "armour") {
    return null;
  }

  const legacyGender = LEGACY_GENDER_SEGMENTS[segments[0]];

  if (legacyGender) {
    if (segments.length === 1) {
      return redirectUnlessSame(
        pathname,
        buildEquipmentCategoryHref("en", legacyGender),
      );
    }

    const legacyCategory = segments[1] as ProductCategory;
    const wcSlug = CATEGORY_TO_WC_SLUG[legacyCategory];

    if (wcSlug) {
      return redirectUnlessSame(
        pathname,
        buildEquipmentCategoryHref("en", legacyGender, wcSlug),
      );
    }
  }

  if (segments.length === 2 && segments[0] === "accessories") {
    const legacyCategory = segments[1] as ProductCategory;
    const wcSlug = CATEGORY_TO_WC_SLUG[legacyCategory];

    if (wcSlug && wcSlug !== segments[1]) {
      return redirectUnlessSame(
        pathname,
        buildEquipmentCategoryHref("en", "accessories", wcSlug),
      );
    }
  }

  if (segments.length === 1) {
    if (WC_ROOT_SLUGS.has(segments[0])) {
      return null;
    }

    const legacyCategory = segments[0] as ProductCategory;
    const topLevel = LEGACY_TOP_LEVEL_CATEGORY_REDIRECTS[legacyCategory];

    if (topLevel) {
      return redirectUnlessSame(pathname, topLevel);
    }
  }

  return null;
}
