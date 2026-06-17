"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { CatalogProduct } from "@/types/catalog-product";
import {
  defaultSortForRoute,
  filterProductsByRoute,
  sortProducts,
  type CategoryRoute,
  type SortOption,
} from "@/lib/shop/category";
import { CatalogLoadMore } from "@/components/shop/catalog-load-more";
import { CatalogProductGrid } from "@/components/shop/catalog-product-grid";
import { CategoryFilters, type ActiveFilters } from "@/components/shop/category-filters";
import { MotorcycleBrandLogoFilter } from "@/components/shop/motorcycle-brand-logo-filter";
import { MobileFilterDrawer } from "@/components/ui/mobile-filter-drawer";
import { cn } from "@/lib/utils";

type CategoryViewProps = {
  route: CategoryRoute;
  products: readonly CatalogProduct[];
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

function getInitialFilters(
  products: readonly CatalogProduct[],
  route?: CategoryRoute,
): ActiveFilters {
  if (products.length === 0) {
    return {
      brands: route?.brand ? [route.brand] : [],
      sizes: [],
      inStockOnly: false,
      priceMin: 0,
      priceMax: 500,
    };
  }

  const prices = products.map((product) => product.price);

  return {
    brands: route?.brand ? [route.brand] : [],
    sizes: [],
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
  return (
    <label className="flex shrink-0 items-center gap-2">
      <span className="font-display text-xs font-bold uppercase tracking-aggressive text-ink/50">
        Sort
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as SortOption)}
        className="min-h-12 border border-ink/15 bg-paper px-4 py-3 font-display text-xs font-bold uppercase tracking-aggressive text-ink focus:border-accent focus:outline-none"
      >
        {showMidRangeSort ? (
          <option value="price-mid">Mid-range</option>
        ) : (
          <option value="featured">Featured</option>
        )}
        <option value="newest">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
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
      filters.sizes.length > 0 &&
      !product.sizes.some((size) => filters.sizes.includes(size))
    ) {
      return false;
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
  const useBrandLogos = brandFilterVariant === "logos";
  const gridClassName = gridDividers
    ? gridColumns === 3
      ? "grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6"
      : "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-6"
    : gridColumns === 3
      ? "grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6"
      : "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-6";
  const gridItemClassName = gridDividers
    ? gridColumns === 3
      ? "relative bg-moto p-4 sm:p-5 lg:p-6 before:pointer-events-none before:absolute before:-bottom-4 before:left-1/2 before:z-10 before:hidden before:h-px before:w-[100px] before:-translate-x-1/2 before:bg-white before:content-[''] after:pointer-events-none after:absolute after:top-1/2 after:z-10 after:hidden after:h-[100px] after:w-px after:-translate-y-1/2 after:bg-white after:content-[''] after:-right-2 lg:after:-right-3 max-sm:[&:not(:last-child)]:before:block sm:max-lg:[&:not(:nth-last-child(-n+2))]:before:block lg:[&:not(:nth-last-child(-n+3))]:before:block sm:max-lg:[&:not(:nth-child(2n))]:after:block lg:[&:not(:nth-child(3n))]:after:block"
      : "relative bg-moto p-4 sm:p-5 lg:p-6 before:pointer-events-none before:absolute before:-bottom-4 before:left-1/2 before:z-10 before:hidden before:h-px before:w-[100px] before:-translate-x-1/2 before:bg-white before:content-[''] after:pointer-events-none after:absolute after:top-1/2 after:z-10 after:hidden after:h-[100px] after:w-px after:-translate-y-1/2 after:bg-white after:content-[''] after:-right-2 xl:after:-right-3 max-sm:[&:not(:last-child)]:before:block sm:max-lg:[&:not(:nth-last-child(-n+2))]:before:block lg:max-xl:[&:not(:nth-last-child(-n+3))]:before:block xl:[&:not(:nth-last-child(-n+4))]:before:block max-sm:[&:not(:last-child)]:after:hidden sm:max-lg:[&:not(:nth-child(2n))]:after:block lg:max-xl:[&:not(:nth-child(3n))]:after:block xl:[&:not(:nth-child(4n))]:after:block"
    : undefined;
  const routeProducts = useMemo(
    () => filterProductsByRoute(products, route),
    [products, route],
  );

  const availableBrands = useMemo(() => {
    if (availableBrandsProp) {
      return [...availableBrandsProp].sort((a, b) => a.localeCompare(b));
    }

    return [...new Set(routeProducts.map((product) => product.brand))].sort(
      (a, b) => a.localeCompare(b),
    );
  }, [availableBrandsProp, routeProducts]);

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
    (crumb) => crumb.href === "/shop/equipment",
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

  const filteredProducts = useMemo(() => {
    const filtered = applyClientFilters(routeProducts, filters, route);
    return sortProducts(filtered, sort);
  }, [routeProducts, filters, sort]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [filteredProducts, pageSize]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const catalogResetKey = `${sort}-${filters.brands.join(",")}-${filters.sizes.join(",")}-${filters.inStockOnly}-${filters.priceMin}-${filters.priceMax}`;

  const clearFilters = () => {
    setFilters(getInitialFilters(routeProducts));
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
    showSizeFilter,
    showBrandFilter: !useBrandLogos,
    whiteFilterTriggers: !useBrandLogos,
    onToggleBrand: toggleBrand,
    onToggleSize: toggleSize,
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
        motoBackground && "bg-moto",
        sectionBackgroundHeading && "relative overflow-hidden",
      )}
    >
      <div className="site-container relative z-10 py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/50">
          {route.breadcrumbs.map((crumb, index) => (
            <li key={crumb.href} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {index === route.breadcrumbs.length - 1 ? (
                <span className="text-ink">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="transition-colors hover:text-accent">
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <header
        className={`relative mb-8 ${sectionBackgroundHeading ? "min-h-[5.5rem] overflow-hidden sm:min-h-[6.5rem] lg:min-h-[7.5rem]" : "max-w-2xl"}`}
      >
        {sectionBackgroundHeading ? (
          <p
            aria-hidden="true"
            className="section-outline-heading absolute right-0 top-[2.75rem] z-0 max-w-[calc(100%-1rem)] origin-right scale-x-100 text-[clamp(1.45rem,5.8vw,2.5rem)] sm:top-[3rem] sm:max-w-none sm:scale-x-[1.12] sm:text-[clamp(2.5rem,7vw,4.25rem)] lg:top-[3.25rem] lg:text-[clamp(3rem,5.5vw,4.75rem)]"
          >
            {route.title}
          </p>
        ) : null}

        <div className={`relative z-10 ${sectionBackgroundHeading ? "max-w-2xl" : ""}`}>
        <p className="section-eyebrow">Shop</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1
            className={cn(
              "heading-category",
              hasLongCategoryTitle &&
                "block max-w-full text-balance leading-[0.95] text-[clamp(1.15rem,4.5vw,2rem)] sm:text-5xl",
            )}
          >
            {route.title}
          </h1>
          <p className="font-display text-sm text-ink/50">
            <span className="font-bold text-ink">{filteredProducts.length}</span>{" "}
            {filteredProducts.length === 1 ? "product" : "products"}
          </p>
        </div>
        <p className="mt-3 text-base text-ink/70">{route.description}</p>
        </div>
      </header>

      {useBrandLogos ? (
        <div className="mb-6 lg:hidden">
          <MotorcycleBrandLogoFilter
            brands={availableBrands}
            selectedBrand={selectedBrand}
            onSelectBrand={selectBrand}
          />
        </div>
      ) : null}

      <div className="mb-6 flex items-center justify-end gap-3 lg:hidden">
        <button
          type="button"
          className={`inline-flex min-h-12 items-center gap-2.5 border border-ink/15 px-5 py-3 font-display text-xs font-bold uppercase tracking-aggressive text-ink transition-colors hover:border-accent hover:text-accent ${
            useBrandLogos ? "" : "bg-paper"
          }`}
          onClick={() => setMobileFiltersOpen(true)}
        >
          Filters
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
            onLoadMore={() =>
              setVisibleCount((count) =>
                Math.min(count + pageSize, filteredProducts.length),
              )
            }
          />
        </>
      ) : (
        <div className="flex min-h-[20rem] flex-col items-start justify-center border border-dashed border-ink/15 bg-surface/50 p-8">
          <p className="font-display text-sm font-bold uppercase tracking-aggressive text-ink">
            No products found
          </p>
          <p className="mt-2 max-w-sm text-sm text-ink/60">
            Try adjusting your filters or browse a broader category.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 font-display text-[10px] font-bold uppercase tracking-aggressive text-accent"
          >
            Clear filters
          </button>
        </div>
      )}

      <MobileFilterDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
      >
        <CategoryFilters {...filterProps} variant="drawer" />
      </MobileFilterDrawer>

      {footer ? <div className="mt-12">{footer}</div> : null}
      </div>
    </div>
  );
}
