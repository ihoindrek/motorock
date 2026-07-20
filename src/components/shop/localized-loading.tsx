"use client";

import { useDictionary } from "@/context/locale-context";
import { CategoryViewSkeleton } from "@/components/shop/category-view-skeleton";
import { EquipmentHubLoading } from "@/components/shop/equipment-hub-loading";
import { ProductPageLoading } from "@/components/shop/product-page-loading";

/**
 * loading.tsx must stay free of request APIs (headers/cookies) or the whole
 * route turns dynamic and skips ISR. Labels come from the locale context
 * provided by the [locale] layout instead.
 */

export function LocalizedEquipmentHubLoading() {
  const dict = useDictionary();
  return <EquipmentHubLoading ariaLabel={dict.common.loadingCategories} />;
}

export function LocalizedProductPageLoading() {
  const dict = useDictionary();
  return <ProductPageLoading ariaLabel={dict.common.loadingProducts} />;
}

export function LocalizedCategoryViewSkeleton() {
  const dict = useDictionary();
  return <CategoryViewSkeleton loadingLabel={dict.common.loadingProducts} />;
}
