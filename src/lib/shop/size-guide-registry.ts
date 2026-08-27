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

/** Normalize legacy guide brand slugs (e.g. johnny-reb-vests → johnny-reb). */
export function normalizeGuideBrandSlug(brandSlug: string) {
  return brandSlug
    .trim()
    .toLowerCase()
    .replace(/-for-(men|women|unisex)$/i, "")
    .replace(/-(men|women|unisex)$/i, "")
    .replace(/-(vests|pants|jackets|gloves|footwear|hoodies)$/i, "");
}

function registerGuideMatch(
  registry: Record<string, SizeGuide>,
  brandSlug: string,
  category: ProductCategory,
  gender: ProductGender,
  guide: SizeGuide,
) {
  const key = sizeGuideLookupKey(brandSlug, category, gender);
  if (!registry[key]) {
    registry[key] = guide;
  }
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

    if (guide.brandSlug) {
      bySlug[guide.brandSlug] = guide;
    }

    if (!guide.brandSlug || !guide.category || !guide.gender) {
      continue;
    }

    const canonicalBrand = normalizeGuideBrandSlug(guide.brandSlug);

    registerGuideMatch(
      byBrandCategoryGender,
      canonicalBrand,
      guide.category,
      guide.gender,
      guide,
    );

    // Legacy guides may still use descriptive slugs on the brand field.
    if (guide.brandSlug !== canonicalBrand) {
      registerGuideMatch(
        byBrandCategoryGender,
        guide.brandSlug,
        guide.category,
        guide.gender,
        guide,
      );
    }
  }

  return { bySlug, byBrandCategoryGender };
}
