/** Shared spacing for product grids and carousels. */
export const PRODUCT_CAROUSEL_SPACE = {
  base: 12,
  md: 16,
  lg: 20,
} as const;

export function catalogProductGridClassName(columns: 3 | 4 = 4) {
  const gap = "gap-x-3 gap-y-5 lg:gap-x-4";

  if (columns === 3) {
    return `grid grid-cols-1 ${gap} sm:grid-cols-2 lg:grid-cols-3`;
  }

  return `grid grid-cols-2 ${gap} sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`;
}

export const wishlistProductGridClassName =
  "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export function favoritesProductGridClassName(columnClass: string) {
  return `grid grid-cols-1 gap-x-4 gap-y-6 ${columnClass}`;
}

/** Vertical divider offset for gridDividers rows (half of gap-y-5). */
export const PRODUCT_GRID_DIVIDER_ROW_OFFSET = "before:-bottom-2.5";
