import type { ProductCategory, ProductGender } from "@/types/catalog-product";
import type { SizeGuide } from "@/types/size-guide";

export type SizeGuideRegistry = {
  bySlug: ReadonlyMap<string, SizeGuide>;
  byBrandCategoryGender: ReadonlyMap<string, SizeGuide>;
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
  const bySlug = new Map<string, SizeGuide>();
  const byBrandCategoryGender = new Map<string, SizeGuide>();

  for (const guide of guides) {
    const slug = guide.slug ?? guide.id;
    bySlug.set(slug, guide);
    bySlug.set(guide.id, guide);

    if (guide.brandSlug && guide.category && guide.gender) {
      byBrandCategoryGender.set(
        sizeGuideLookupKey(guide.brandSlug, guide.category, guide.gender),
        guide,
      );
    }
  }

  return { bySlug, byBrandCategoryGender };
}
