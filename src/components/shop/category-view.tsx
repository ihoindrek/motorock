"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useDictionary, useLocale } from "@/context/locale-context";
import type { CatalogProduct } from "@/types/catalog-product";
import {
  defaultSortForRoute,
  filterProductsByRoute,
  resolveCategoryFilterFacets,
  productHasSizeOptions,
  sortProducts,
  type CategoryRoute,
  type SortOption,
} from "@/lib/shop/category";
import { isLikelyFilterSizeLabel } from "@/lib/shop/size-label";
import { sortProductSizes } from "@/lib/shop/sort-sizes";
import { CatalogLoadMore } from "@/components/shop/catalog-load-more";
import { CatalogProductGrid } from "@/components/shop/catalog-product-grid";
import { EquipmentSubcategoryGrid } from "@/components/shop/equipment-subcategory-grid";
import {
  PRODUCT_GRID_DIVIDER_ROW_OFFSET,
  catalogProductGridClassName,
} from "@/lib/shop/product-grid-layout";
import { CategoryDescription } from "@/components/shop/category-description";
import { CategoryFilters, type ActiveFilters } from "@/components/shop/category-filters";
import {
  matchProductCategoriesFromParam,
  resolveAvailableProductCategories,
  shouldShowBrandProductCategoryFilter,
} from "@/lib/shop/brand-category-filter";
import type { ProductCategory } from "@/types/catalog-product";
import { MotorcycleBrandLogoFilter } from "@/components/shop/motorcycle-brand-logo-filter";
import { MobileFilterDrawer } from "@/components/ui/mobile-filter-drawer";
import { localizedHref } from "@/i18n/paths";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";
import { trackViewItemList } from "@/lib/analytics";
import type { EquipmentSubcategory } from "@/lib/shop/equipment-subcategories";
import {
  matchDisplacementsFromParam,
  resolveAvailableDisplacements,
  resolveProductDisplacement,
} from "@/lib/shop/motorcycle-displacement";
import { cn } from "@/lib/utils";

type CategoryViewProps = {
  route: CategoryRoute;
  products: readonly CatalogProduct[];
  subcategories?: readonly EquipmentSubcategory[];
  availableBrands?: readonly string[];
  showSizeFilter?: boolean;
  brandFilterVariant?: "dropdown" | "logos";
  pageSize?: number;
  gridColumns?: 3 | 4;
  gridDividers?: boolean;
  sectionBackgroundHeading?: boolean;
  motoBackground?: boolean;
  footer?: ReactNode;
};

const SORT_OPTIONS: readonly SortOption[] = [
  "featured",
  "price-asc",
  "price-desc",
  "newest",
  "price-mid",
];

/** "Pando Moto" -> "pando-moto" for shareable filter URLs. */
function filterValueSlug(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

function matchBySlug(param: string, available: readonly string[]) {
  const wanted = param
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map(filterValueSlug);

  return available.filter((value) => wanted.includes(filterValueSlug(value)));
}

function getInitialFilters(
  products: readonly CatalogProduct[],
  route?: CategoryRoute,
): ActiveFilters {
  if (products.length === 0) {
    return {
      brands: route?.brand ? [route.brand] : [],
      sizes: [],
      categories: [],
      displacements: [],
      inStockOnly: false,
      priceMin: 0,
      priceMax: 500,
    };
  }

  const prices = products.map((product) => product.price);

  return {
    brands: route?.brand ? [route.brand] : [],
    sizes: [],
    categories: [],
    displacements: [],
    inStockOnly: false,
    priceMin: Math.min(...prices),
    priceMax: Math.max(...prices),
  };
}

function CatalogSortSelect({
  value,
  onChange,
  showMidRangeSort = false,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
  showMidRangeSort?: boolean;
}) {
  const dict = useDictionary();

  return (
    // min-w-0 lets the select shrink below the width of its longest option
    // so it cannot push the Filters button off-screen on narrow viewports.
    <label className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 font-body text-xs font-bold uppercase tracking-aggressive text-ink/50">
        {dict.catalog.sort}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as SortOption)}
        className="min-h-12 min-w-0 border border-ink/15 bg-paper px-4 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-ink focus:border-accent focus:outline-none"
      >
        {showMidRangeSort ? (
          <option value="price-mid">{dict.catalog.midRange}</option>
        ) : (
          <option value="featured">{dict.catalog.featured}</option>
        )}
        <option value="newest">{dict.catalog.newest}</option>
        <option value="price-asc">{dict.catalog.priceLowHigh}</option>
        <option value="price-desc">{dict.catalog.priceHighLow}</option>
      </select>
    </label>
  );
}

function matchesAvailabilityFilter(
  product: CatalogProduct,
  route: CategoryRoute,
): boolean {
  if (route.category === "motorcycles") {
    return Boolean(product.inStock && product.showroomAvailable);
  }

  return product.inStock;
}

function applyClientFilters(
  products: CatalogProduct[],
  filters: ActiveFilters,
  route: CategoryRoute,
) {
  return products.filter((product) => {
    if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
      return false;
    }

    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(product.category)
    ) {
      return false;
    }

    if (
      filters.sizes.length > 0 &&
      !product.sizes.some((size) => filters.sizes.includes(size))
    ) {
      return false;
    }

    if (filters.displacements.length > 0) {
      const displacement = resolveProductDisplacement(product);
      if (!displacement || !filters.displacements.includes(displacement)) {
        return false;
      }
    }

    if (filters.inStockOnly && !matchesAvailabilityFilter(product, route)) {
      return false;
    }

    if (product.price < filters.priceMin || product.price > filters.priceMax) {
      return false;
    }

    return true;
  });
}

export function CategoryView({
  route,
  products,
  subcategories = [],
  availableBrands: availableBrandsProp,
  showSizeFilter = true,
  brandFilterVariant = "dropdown",
  pageSize = 12,
  gridColumns = 4,
  gridDividers = false,
  sectionBackgroundHeading = false,
  motoBackground = false,
  footer,
}: CategoryViewProps) {
  const dict = useDictionary();
  const locale = useLocale();
  const showSubcategoryLanding = subcategories.length > 0;
  const subcategoryCopy =
    locale === "et"
      ? {
          eyebrow: "Alamkategooriad",
          singular: "kategooria",
          plural: "kategooriat",
        }
      : {
          eyebrow: "Categories",
          singular: "category",
          plural: "categories",
        };
  const useBrandLogos = brandFilterVariant === "logos";
  const motorcycleGridDividerItemClassName =
    gridColumns === 3
      ? `relative bg-moto p-4 sm:p-5 lg:p-6 before:pointer-events-none before:absolute ${PRODUCT_GRID_DIVIDER_ROW_OFFSET} before:left-1/2 before:z-10 before:hidden before:h-px before:w-[100px] before:-translate-x-1/2 before:bg-white before:content-[''] after:pointer-events-none after:absolute after:top-1/2 after:z-10 after:hidden after:h-[100px] after:w-px after:-translate-y-1/2 after:bg-white after:content-[''] after:-right-2 lg:after:-right-3 max-sm:[&:not(:last-child)]:before:block sm:max-lg:[&:not(:nth-last-child(-n+2))]:before:block lg:[&:not(:nth-last-child(-n+3))]:before:block sm:max-lg:[&:not(:nth-child(2n))]:after:block lg:[&:not(:nth-child(3n))]:after:block`
      : `relative bg-moto p-4 sm:p-5 lg:p-6 before:pointer-events-none before:absolute ${PRODUCT_GRID_DIVIDER_ROW_OFFSET} before:left-1/2 before:z-10 before:hidden before:h-px before:w-[100px] before:-translate-x-1/2 before:bg-white before:content-[''] after:pointer-events-none after:absolute after:top-1/2 after:z-10 after:hidden after:h-[100px] after:w-px after:-translate-y-1/2 after:bg-white after:content-[''] after:-right-2 xl:after:-right-3 max-sm:[&:not(:last-child)]:before:block sm:max-lg:[&:not(:nth-last-child(-n+2))]:before:block lg:max-xl:[&:not(:nth-last-child(-n+3))]:before:block xl:[&:not(:nth-last-child(-n+4))]:before:block max-sm:[&:not(:last-child)]:after:hidden sm:max-lg:[&:not(:nth-child(2n))]:after:block lg:max-xl:[&:not(:nth-child(3n))]:after:block xl:[&:not(:nth-child(4n))]:after:block`;
  const routeProducts = useMemo(
    () => filterProductsByRoute(products, route),
    [products, route],
  );

  const filterFacets = useMemo(
    () => resolveCategoryFilterFacets(route, routeProducts),
    [route, routeProducts],
  );

  const availableBrands = useMemo(() => {
    if (availableBrandsProp) {
      return [...availableBrandsProp].sort((a, b) => a.localeCompare(b));
    }

    return [...new Set(routeProducts.map((product) => product.brand))].sort(
      (a, b) => a.localeCompare(b),
    );
  }, [availableBrandsProp, routeProducts]);

  const availableSizes = useMemo(
    () =>
      sortProductSizes(
        [...new Set(
          routeProducts
            .filter(productHasSizeOptions)
            .flatMap((product) => product.sizes)
            .filter((size) => isLikelyFilterSizeLabel(size)),
        )],
      ),
    [routeProducts],
  );

  const availableProductCategories = useMemo(
    () => resolveAvailableProductCategories(routeProducts, dict),
    [routeProducts, dict],
  );

  const availableDisplacements = useMemo(
    () => resolveAvailableDisplacements(routeProducts),
    [routeProducts],
  );

  const showProductCategoryFilter = useMemo(
    () => shouldShowBrandProductCategoryFilter(route.brand, availableProductCategories),
    [availableProductCategories, route.brand],
  );

  const priceBounds = useMemo(() => {
    if (routeProducts.length === 0) {
      return { min: 0, max: 500 };
    }

    const prices = routeProducts.map((product) => product.price);

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [routeProducts]);

  const isMotorcycleCatalog = route.category === "motorcycles";
  const isToolsCatalog = route.category === "tools";
  const isEquipmentCatalog = route.breadcrumbs.some(
    (crumb) => crumb.href === buildEquipmentHubHref(locale),
  );
  const hasLongCategoryTitle =
    isMotorcycleCatalog ||
    isToolsCatalog ||
    isEquipmentCatalog ||
    route.title.length > 12;
  const [filters, setFilters] = useState(() =>
    getInitialFilters(routeProducts, route),
  );
  const [sort, setSort] = useState<SortOption>(() => defaultSortForRoute(route));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const urlFiltersApplied = useRef(false);

  // Apply filters from the query string once after mount. The pages are
  // statically prerendered (ISR), so the server never sees search params —
  // this is what makes filtered views shareable (e.g. ?brand=pando-moto).
  useEffect(() => {
    if (urlFiltersApplied.current) {
      return;
    }
    urlFiltersApplied.current = true;

    const params = new URLSearchParams(window.location.search);
    const sortParam = params.get("sort");

    if (sortParam && SORT_OPTIONS.includes(sortParam as SortOption)) {
      setSort(sortParam as SortOption);
    }

    const brandParam = params.get("brand");
    const categoryParam = params.get("category");
    const displacementParam = params.get("displacement");
    const sizeParam = params.get("size");
    const stockParam = params.get("stock");
    const priceParam = params.get("price");

    if (
      !brandParam &&
      !categoryParam &&
      !displacementParam &&
      !sizeParam &&
      !stockParam &&
      !priceParam
    ) {
      return;
    }

    setFilters((current) => {
      const next = { ...current };

      if (brandParam) {
        const brands = matchBySlug(brandParam, availableBrands);
        if (brands.length > 0) {
          next.brands = brands;
        }
      }

      if (categoryParam) {
        const categories = matchProductCategoriesFromParam(
          categoryParam,
          availableProductCategories,
        );
        if (categories.length > 0) {
          next.categories = categories;
        }
      }

      if (displacementParam) {
        const displacements = matchDisplacementsFromParam(
          displacementParam,
          availableDisplacements,
        );
        if (displacements.length > 0) {
          next.displacements = displacements;
        }
      }

      if (sizeParam) {
        const sizes = matchBySlug(sizeParam, availableSizes);
        if (sizes.length > 0) {
          next.sizes = sizes;
        }
      }

      if (stockParam === "1") {
        next.inStockOnly = true;
      }

      if (priceParam) {
        const [min, max] = priceParam.split("-").map((value) => Number(value));
        if (Number.isFinite(min) && Number.isFinite(max) && min <= max) {
          next.priceMin = Math.max(min, priceBounds.min);
          next.priceMax = Math.min(max, priceBounds.max);
        }
      }

      return next;
    });
  }, [
    availableBrands,
    availableDisplacements,
    availableProductCategories,
    availableSizes,
    priceBounds,
  ]);

  // Reflect the active filters back into the URL (replaceState keeps the
  // navigation client-side) so the current view can be copied and shared.
  useEffect(() => {
    if (!urlFiltersApplied.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    const setOrDelete = (key: string, value: string | null) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    };

    // When the brand is part of the route itself (brand catalogs, deep-linked
    // motorcycle brand views), the brand param belongs to the outer route —
    // leave it alone.
    if (!route.brand) {
      setOrDelete(
        "brand",
        filters.brands.length > 0
          ? filters.brands.map(filterValueSlug).join(",")
          : null,
      );
    }
    setOrDelete(
      "size",
      filters.sizes.length > 0
        ? filters.sizes.map(filterValueSlug).join(",")
        : null,
    );
    setOrDelete(
      "category",
      filters.categories.length > 0 ? filters.categories.join(",") : null,
    );
    setOrDelete(
      "displacement",
      filters.displacements.length > 0 ? filters.displacements.join(",") : null,
    );
    setOrDelete("stock", filters.inStockOnly ? "1" : null);
    const priceNarrowed =
      filters.priceMin > priceBounds.min || filters.priceMax < priceBounds.max;
    setOrDelete(
      "price",
      priceNarrowed ? `${filters.priceMin}-${filters.priceMax}` : null,
    );
    setOrDelete("sort", sort !== defaultSortForRoute(route) ? sort : null);

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;

    if (nextUrl !== `${window.location.pathname}${window.location.search}`) {
      try {
        window.history.replaceState(window.history.state, "", nextUrl);
      } catch {
        // Safari private mode / restricted contexts can reject replaceState.
      }
    }
  }, [filters, sort, priceBounds, route]);

  const filteredProducts = useMemo(() => {
    const filtered = applyClientFilters(routeProducts, filters, route);
    return sortProducts(filtered, sort);
  }, [routeProducts, filters, sort]);

  const sparseDesktopCount = useMemo(() => {
    if (!isMotorcycleCatalog || gridColumns !== 3) {
      return undefined;
    }

    const count = filteredProducts.length;

    return count > 0 && count < 3 ? count : undefined;
  }, [filteredProducts.length, gridColumns, isMotorcycleCatalog]);

  const gridClassName = useMemo(
    () =>
      catalogProductGridClassName(gridColumns, {
        sparseDesktopCount,
      }),
    [gridColumns, sparseDesktopCount],
  );

  const gridItemClassName = useMemo(() => {
    if (!gridDividers) {
      return undefined;
    }

    if (sparseDesktopCount !== undefined) {
      return "relative bg-moto p-4 sm:p-5 lg:p-6";
    }

    return motorcycleGridDividerItemClassName;
  }, [gridDividers, motorcycleGridDividerItemClassName, sparseDesktopCount]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [filteredProducts, pageSize]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const catalogResetKey = `${sort}-${filters.brands.join(",")}-${filters.categories.join(",")}-${filters.displacements.join(",")}-${filters.sizes.join(",")}-${filters.inStockOnly}-${filters.priceMin}-${filters.priceMax}`;

  useEffect(() => {
    if (visibleProducts.length === 0) {
      return;
    }

    const listId =
      route.wcCategorySlug ??
      route.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    trackViewItemList({
      listId,
      listName: route.title,
      products: visibleProducts,
    });
    // Track list impressions when filters/sort change, not on "load more".
    // eslint-disable-next-line react-hooks/exhaustive-deps -- catalogResetKey covers filter changes.
  }, [catalogResetKey, route.title, route.wcCategorySlug]);

  const clearFilters = () => {
    setFilters(getInitialFilters(routeProducts, route));
  };

  const toggleBrand = (brand: string) => {
    setFilters((current) => ({
      ...current,
      brands: current.brands.includes(brand)
        ? current.brands.filter((value) => value !== brand)
        : [...current.brands, brand],
    }));
  };

  const toggleSize = (size: string) => {
    setFilters((current) => ({
      ...current,
      sizes: current.sizes.includes(size)
        ? current.sizes.filter((value) => value !== size)
        : [...current.sizes, size],
    }));
  };

  const toggleCategory = (category: ProductCategory) => {
    setFilters((current) => ({
      ...current,
      categories: current.categories.includes(category)
        ? current.categories.filter((value) => value !== category)
        : [...current.categories, category],
    }));
  };

  const toggleDisplacement = (displacement: number) => {
    setFilters((current) => ({
      ...current,
      displacements: current.displacements.includes(displacement)
        ? current.displacements.filter((value) => value !== displacement)
        : [...current.displacements, displacement],
    }));
  };

  const selectedBrand =
    filters.brands.length === 1 ? filters.brands[0] : null;

  const selectBrand = (brand: string | null) => {
    setFilters((current) => ({
      ...current,
      brands: brand ? [brand] : [],
    }));
  };

  const filterProps = {
    route,
    activeFilters: filters,
    priceBounds,
    availableBrands,
    availableSizes,
    availableProductCategories,
    availableDisplacements,
    showSizeFilter: showSizeFilter && filterFacets.showSizeFilter,
    // Prefer live available brands so the Brand control is not hidden when facets
    // under-count unique brands (equipment main categories).
    showBrandFilter:
      !useBrandLogos &&
      !route.brand &&
      (filterFacets.showBrandFilter || availableBrands.length > 0),
    showCategoryFilter: filterFacets.showCategoryFilter && !showProductCategoryFilter,
    showProductCategoryFilter,
    showDisplacementFilter: filterFacets.showDisplacementFilter,
    whiteFilterTriggers: !useBrandLogos,
    onToggleBrand: toggleBrand,
    onToggleSize: toggleSize,
    onToggleCategory: toggleCategory,
    onToggleDisplacement: toggleDisplacement,
    onInStockChange: (value: boolean) =>
      setFilters((current) => ({ ...current, inStockOnly: value })),
    onPriceMinChange: (value: number) =>
      setFilters((current) => ({ ...current, priceMin: value })),
    onPriceMaxChange: (value: number) =>
      setFilters((current) => ({ ...current, priceMax: value })),
    onClear: clearFilters,
  };

  return (
    <div
      className={cn(
        motoBackground ? "bg-moto" : "bg-white",
        sectionBackgroundHeading && "relative overflow-hidden",
      )}
    >
      <div className="site-container relative z-10 py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/50">
          {route.breadcrumbs.map((crumb, index) => (
            <li key={crumb.href} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {index === route.breadcrumbs.length - 1 ? (
                <span className="text-ink">{crumb.label}</span>
              ) : (
                <Link
                  href={localizedHref(locale, crumb.href)}
                  className="transition-colors hover:text-accent"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <header
        className={cn(
          "relative mb-8",
          sectionBackgroundHeading &&
            "min-h-[5.5rem] overflow-hidden sm:min-h-[6.5rem] lg:min-h-[7.5rem]",
        )}
      >
        {sectionBackgroundHeading ? (
          <p
            aria-hidden="true"
            className="section-outline-heading absolute right-0 top-[2.75rem] z-0 max-w-[calc(100%-1rem)] origin-right scale-x-100 text-[clamp(1.45rem,5.8vw,2.5rem)] sm:top-[3rem] sm:max-w-none sm:scale-x-[1.12] sm:text-[clamp(2.5rem,7vw,4.25rem)] lg:top-[3.25rem] lg:text-[clamp(3rem,5.5vw,4.75rem)]"
          >
            {route.title}
          </p>
        ) : null}

        <div
          className={cn(
            "relative z-10",
            "lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end lg:gap-12 xl:gap-20",
            sectionBackgroundHeading && "max-w-2xl lg:max-w-none",
          )}
        >
          <div>
            <p className="section-eyebrow">{dict.common.shop}</p>
            <div className="mt-2">
              <h1
                className={cn(
                  "heading-category",
                  hasLongCategoryTitle &&
                    "block max-w-full text-balance leading-[0.95] text-[clamp(1.25rem,5vw,2.2rem)] sm:text-6xl",
                )}
              >
                {route.title}
              </h1>
              <p className="mt-1 font-body text-sm text-ink/50">
                {showSubcategoryLanding ? (
                  <>
                    <span className="font-bold text-ink">
                      {subcategories.length}
                    </span>{" "}
                    {subcategories.length === 1
                      ? subcategoryCopy.singular
                      : subcategoryCopy.plural}
                  </>
                ) : (
                  <>
                    <span className="font-bold text-ink">
                      {filteredProducts.length}
                    </span>{" "}
                    {filteredProducts.length === 1
                      ? dict.catalog.productSingular
                      : dict.catalog.productPlural}
                  </>
                )}
              </p>
            </div>
          </div>

          {route.description ? (
            <CategoryDescription text={route.description} />
          ) : null}
        </div>
      </header>

      {showSubcategoryLanding ? (
        <EquipmentSubcategoryGrid
          locale={locale}
          subcategories={subcategories}
        />
      ) : (
        <>
      {useBrandLogos ? (
        <div className="mb-6 lg:hidden">
          <MotorcycleBrandLogoFilter
            brands={availableBrands}
            selectedBrand={selectedBrand}
            onSelectBrand={selectBrand}
            fadeTone={motoBackground ? "moto" : "paper"}
          />
        </div>
      ) : null}

      <div className="mb-6 flex items-center justify-end gap-3 lg:hidden">
        <button
          type="button"
          className={`inline-flex min-h-12 items-center gap-2.5 border border-ink/15 px-5 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-ink transition-colors hover:border-accent hover:text-accent ${
            useBrandLogos ? "" : "bg-paper"
          }`}
          onClick={() => setMobileFiltersOpen(true)}
        >
          {dict.catalog.filters}
        </button>
        <CatalogSortSelect
          value={sort}
          onChange={setSort}
          showMidRangeSort={isMotorcycleCatalog}
        />
      </div>

      <div className="mb-6 hidden lg:flex lg:items-center lg:gap-4 lg:border-b lg:border-ink/10 lg:pb-5">
        {useBrandLogos ? (
          <MotorcycleBrandLogoFilter
            brands={availableBrands}
            selectedBrand={selectedBrand}
            onSelectBrand={selectBrand}
            layout="inline"
            className="min-w-0 flex-1"
          />
        ) : (
          <CategoryFilters
            {...filterProps}
            variant="bar"
            embedded
            embeddedAlign="start"
            className="min-w-0 flex-1"
          />
        )}
        <div className="flex shrink-0 items-center gap-3">
          {useBrandLogos ? (
            <CategoryFilters
              {...filterProps}
              variant="bar"
              embedded
              embeddedAlign="end"
            />
          ) : null}
          <CatalogSortSelect
          value={sort}
          onChange={setSort}
          showMidRangeSort={isMotorcycleCatalog}
        />
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <>
          <CatalogProductGrid
            products={visibleProducts}
            listClassName={gridClassName}
            itemClassName={gridItemClassName}
            resetKey={catalogResetKey}
          />

          <CatalogLoadMore
            visibleCount={visibleProducts.length}
            totalCount={filteredProducts.length}
            pageSize={pageSize}
            loadMoreLabel={
              isMotorcycleCatalog ? dict.catalog.loadMoreMotorcycles : undefined
            }
            onLoadMore={() =>
              setVisibleCount((count) =>
                Math.min(count + pageSize, filteredProducts.length),
              )
            }
          />
        </>
      ) : (
        <div className="flex min-h-[20rem] flex-col items-start justify-center border border-dashed border-ink/15 bg-surface/50 p-8">
          <p className="font-body text-sm font-bold uppercase tracking-aggressive text-ink">
            {dict.catalog.noProductsFound}
          </p>
          <p className="mt-2 max-w-sm text-sm text-ink/60">
            {dict.catalog.noProductsHint}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 font-body text-[10px] font-bold uppercase tracking-aggressive text-accent"
          >
            {dict.catalog.clearFilters}
          </button>
        </div>
      )}

      <MobileFilterDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title={dict.catalog.filters}
      >
        <CategoryFilters {...filterProps} variant="drawer" />
      </MobileFilterDrawer>
        </>
      )}

      {footer ? <div className="mt-12">{footer}</div> : null}
      </div>
    </div>
  );
}
