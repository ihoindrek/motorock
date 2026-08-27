import type { ProductCategory, ProductGender } from "@/types/catalog-product";
import type { SizeGuide } from "@/types/size-guide";

/** Plain objects — must stay JSON-serializable for unstable_cache. */
export type SizeGuideRegistry = {
  bySlug: Readonly<Record<string, SizeGuide>>;
  byBrandCategoryGender: Readonly<Record<string, SizeGuide>>;
};

export function sizeGuideLookupKey(
  brandSlug: string,
  category: ProductCategory,
  gender: ProductGender,
) {
  return `${brandSlug}:${category}:${gender}`;
}

export function buildSizeGuideRegistry(
  guides: readonly SizeGuide[],
): SizeGuideRegistry {
  const bySlug: Record<string, SizeGuide> = {};
  const byBrandCategoryGender: Record<string, SizeGuide> = {};

  for (const guide of guides) {
    const slug = guide.slug ?? guide.id;
    bySlug[slug] = guide;
    bySlug[guide.id] = guide;

    // Allow product override by ACF brand slug (e.g. johnny-reb-vests) when WP post slug is numeric.
    if (guide.brandSlug) {
      bySlug[guide.brandSlug] = guide;
    }

    if (guide.brandSlug && guide.category && guide.gender) {
      byBrandCategoryGender[
        sizeGuideLookupKey(guide.brandSlug, guide.category, guide.gender)
      ] = guide;
    }
  }

  return { bySlug, byBrandCategoryGender };
}
