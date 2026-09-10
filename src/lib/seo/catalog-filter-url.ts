import { stripLocaleFromPath } from "@/i18n/paths";
import { isBrandCatalogPath } from "@/lib/shop/brand-url";
import { isEquipmentCategoryPath } from "@/lib/shop/category-url";

/** Query keys written by CategoryView filter state → URL sync. */
export const CATALOG_FILTER_QUERY_KEYS = [
  "brand",
  "size",
  "category",
  "gender",
  "displacement",
  "stock",
  "price",
  "sort",
] as const;

const CATALOG_HUB_PATHS = new Set([
  "/shop/motorcycles",
  "/shop/tools",
  "/shop/tools-maintenance",
  "/shop/equipment",
]);

export function hasCatalogFilterQuery(search: string) {
  if (!search || search === "?") {
    return false;
  }

  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  return CATALOG_FILTER_QUERY_KEYS.some((key) => params.has(key));
}

export function isCatalogFilterablePath(pathname: string) {
  if (isEquipmentCategoryPath(pathname)) {
    return true;
  }

  if (isBrandCatalogPath(pathname)) {
    return true;
  }

  const basePath = stripLocaleFromPath(pathname);

  return CATALOG_HUB_PATHS.has(basePath);
}

/** Filtered catalog views are shareable but should not be indexed. */
export function shouldNoindexCatalogFilterUrl(pathname: string, search: string) {
  return (
    isCatalogFilterablePath(pathname) &&
    hasCatalogFilterQuery(search)
  );
}
