import type { ProductCategory } from "@/types/catalog-product";
import {
  ACCESSORY_CATEGORIES,
  CATEGORY_TO_WC_SLUG,
  PROTECTION_CATEGORIES,
} from "@/lib/shop/wc-categories";
import { buildEquipmentCategoryHref } from "@/lib/shop/equipment-route";

const LEGACY_GENDER_SEGMENTS: Record<string, "for-men" | "for-women"> = {
  men: "for-men",
  women: "for-women",
};

const LEGACY_TOP_LEVEL_CATEGORY_REDIRECTS: Partial<
  Record<ProductCategory, string>
> = {
  jackets: buildEquipmentCategoryHref("for-men", "jackets-and-tags"),
  vests: buildEquipmentCategoryHref("for-men", "vests-2"),
  pants: buildEquipmentCategoryHref("for-men", "mens-pants"),
  gloves: buildEquipmentCategoryHref("for-men", "gloves"),
  footwear: buildEquipmentCategoryHref("for-men", "footwear"),
  hoodies: buildEquipmentCategoryHref("for-men", "sweaters"),
  "t-shirts": buildEquipmentCategoryHref("for-men", "t-shirts"),
  "base-layers": buildEquipmentCategoryHref("for-men", "base-layer-warm-underwear"),
  helmets: buildEquipmentCategoryHref("helmets"),
  "helmet-accessories": buildEquipmentCategoryHref("helmets", "helmet-accessories"),
  goggles: buildEquipmentCategoryHref("accessories", "goggles"),
  headwear: buildEquipmentCategoryHref("accessories", "headwear"),
  bags: buildEquipmentCategoryHref("accessories", "bags-backpacks"),
  belts: buildEquipmentCategoryHref("accessories", "belts"),
  jewelry: buildEquipmentCategoryHref("accessories", "jewelry"),
  scarves: buildEquipmentCategoryHref("accessories", "scarves-tubulars"),
  socks: buildEquipmentCategoryHref("accessories", "socks"),
  safety: buildEquipmentCategoryHref("accessories", "safety"),
  accessories: buildEquipmentCategoryHref("accessories", "small-accessories"),
};

function redirectAccessoryCategory(category: ProductCategory) {
  const wcSlug = CATEGORY_TO_WC_SLUG[category];

  if (!wcSlug) {
    return null;
  }

  if (PROTECTION_CATEGORIES.includes(category) && category === "helmets") {
    return buildEquipmentCategoryHref("helmets");
  }

  if (ACCESSORY_CATEGORIES.includes(category)) {
    return buildEquipmentCategoryHref("accessories", wcSlug);
  }

  return null;
}

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
      return buildEquipmentCategoryHref(legacyGender);
    }

    const legacyCategory = segments[1] as ProductCategory;
    const wcSlug = CATEGORY_TO_WC_SLUG[legacyCategory];

    if (wcSlug) {
      return buildEquipmentCategoryHref(legacyGender, wcSlug);
    }
  }

  if (segments.length === 1 && segments[0] === "accessories") {
    return buildEquipmentCategoryHref("accessories");
  }

  if (segments.length === 2 && segments[0] === "accessories") {
    const legacyCategory = segments[1] as ProductCategory;
    const redirect = redirectAccessoryCategory(legacyCategory);

    if (redirect) {
      return redirect;
    }
  }

  if (segments.length === 1) {
    const legacyCategory = segments[0] as ProductCategory;
    const topLevel = LEGACY_TOP_LEVEL_CATEGORY_REDIRECTS[legacyCategory];

    if (topLevel) {
      return topLevel;
    }
  }

  return null;
}
