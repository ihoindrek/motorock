/** Shared spacing for product grids and carousels. */
export const PRODUCT_CAROUSEL_SPACE = {
  base: 16,
  md: 22,
  lg: 28,
} as const;

type CatalogProductGridOptions = {
  /** Desktop column count when a motorcycle catalog shows 1–2 results. */
  sparseDesktopCount?: number;
};

export function catalogProductGridClassName(
  columns: 3 | 4 = 4,
  options?: CatalogProductGridOptions,
) {
  const gap = "gap-x-4 gap-y-8 sm:gap-y-9 lg:gap-x-5 lg:gap-y-10";
  const sparseCount = options?.sparseDesktopCount;

  if (
    columns === 3 &&
    sparseCount !== undefined &&
    sparseCount > 0 &&
    sparseCount < 3
  ) {
    const desktopColumns =
      sparseCount === 1 ? "lg:grid-cols-1" : "lg:grid-cols-2";

    return `grid grid-cols-1 ${gap} sm:grid-cols-2 ${desktopColumns}`;
  }

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

/** Vertical divider offset for gridDividers rows (half of gap-y-8). */
export const PRODUCT_GRID_DIVIDER_ROW_OFFSET = "before:-bottom-4";
