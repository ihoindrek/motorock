"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { localizedHref } from "@/i18n/paths";
import type { CatalogProduct } from "@/types/catalog-product";
import { CatalogLoadMore } from "@/components/shop/catalog-load-more";
import { CatalogProductGrid } from "@/components/shop/catalog-product-grid";
import {
  CategoryFilters,
  type ActiveFilters,
} from "@/components/shop/category-filters";
import { MobileFilterDrawer } from "@/components/ui/mobile-filter-drawer";
import {
  searchResultsRoute,
  sortProducts,
  type SortOption,
} from "@/lib/shop/category";

type SearchResultsViewProps = {
  query: string;
  products: readonly CatalogProduct[];
  dictionary: Dictionary;
  locale: Locale;
};

type ProductTypeFilter = "all" | "motorcycle" | "equipment" | "tools";

function getTypeFilterLabels(
  dictionary: Dictionary,
): Record<ProductTypeFilter, string> {
  return {
    all: dictionary.search.all,
    motorcycle: dictionary.search.motorcycles,
    equipment: dictionary.search.equipment,
    tools: dictionary.search.tools,
  };
}

function productMatchesType(
  product: CatalogProduct,
  type: ProductTypeFilter,
): boolean {
  if (type === "all") {
    return true;
  }

  if (type === "motorcycle") {
    return product.type === "motorcycle";
  }

  if (type === "equipment") {
    return product.type === "equipment" && product.category !== "tools";
  }

  return product.category === "tools";
}

function getSearchFacets(products: readonly CatalogProduct[]) {
  const typeOptions = (
    ["all", "motorcycle", "equipment", "tools"] as const
  ).filter(
    (type) =>
      type === "all" || products.some((product) => productMatchesType(product, type)),
  );

  const brands = new Set(products.map((product) => product.brand));

  return {
    typeOptions,
    showTypeFilter: typeOptions.length > 2,
    showBrandFilter: brands.size > 1,
    showSizeFilter: products.some(
      (product) =>
        product.type === "equipment" &&
        product.category !== "tools" &&
        product.sizes.length > 0,
    ),
  };
}

const filterTriggerClass =
  "inline-flex min-h-12 items-center gap-2.5 border border-ink/15 bg-white px-5 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-ink transition-colors hover:border-accent hover:text-accent";

function getInitialFilters(products: readonly CatalogProduct[]): ActiveFilters {
  if (products.length === 0) {
    return {
      brands: [],
      sizes: [],
      inStockOnly: false,
      priceMin: 0,
      priceMax: 500,
    };
  }

  const prices = products.map((product) => product.price);

  return {
    brands: [],
    sizes: [],
    inStockOnly: false,
    priceMin: Math.min(...prices),
    priceMax: Math.max(...prices),
  };
}

function applySearchFilters(
  products: CatalogProduct[],
  filters: ActiveFilters,
  typeFilter: ProductTypeFilter,
) {
  return products.filter((product) => {
    if (!productMatchesType(product, typeFilter)) {
      return false;
    }

    if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
      return false;
    }

    if (
      filters.sizes.length > 0 &&
      !product.sizes.some((size) => filters.sizes.includes(size))
    ) {
      return false;
    }

    if (filters.inStockOnly && !product.inStock) {
      return false;
    }

    if (product.price < filters.priceMin || product.price > filters.priceMax) {
      return false;
    }

    return true;
  });
}

function CatalogSortSelect({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  return (
    <label className="flex shrink-0 items-center gap-2">
      <span className="font-body text-xs font-bold uppercase tracking-aggressive text-ink/50">
        Sort
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as SortOption)}
        className="min-h-12 border border-ink/15 bg-white px-4 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-ink focus:border-accent focus:outline-none"
      >
        <option value="featured">Featured</option>
        <option value="newest">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
      </select>
    </label>
  );
}

function SearchTypeFilter({
  options,
  value,
  onChange,
  labels,
  className = "",
}: {
  options: readonly ProductTypeFilter[];
  value: ProductTypeFilter;
  onChange: (value: ProductTypeFilter) => void;
  labels: Record<ProductTypeFilter, string>;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap gap-2 ${className}`}
      role="group"
      aria-label="Product type"
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={`${filterTriggerClass} ${
            value === option
              ? "border-accent bg-accent text-paper hover:text-paper"
              : ""
          }`}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}

export function SearchResultsView({
  query,
  products,
  dictionary,
  locale,
}: SearchResultsViewProps) {
  const typeFilterLabels = getTypeFilterLabels(dictionary);
  const hasQuery = query.length >= 2;
  const pageSize = 12;

  const [filters, setFilters] = useState(() => getInitialFilters(products));
  const [typeFilter, setTypeFilter] = useState<ProductTypeFilter>("all");
  const [sort, setSort] = useState<SortOption>("featured");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const facets = useMemo(() => getSearchFacets(products), [products]);

  const availableBrands = useMemo(
    () =>
      [...new Set(products.map((product) => product.brand))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [products],
  );

  const priceBounds = useMemo(() => {
    if (products.length === 0) {
      return { min: 0, max: 500 };
    }

    const prices = products.map((product) => product.price);

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const filtered = applySearchFilters([...products], filters, typeFilter);
    return sortProducts(filtered, sort);
  }, [products, filters, typeFilter, sort]);

  useEffect(() => {
    setFilters(getInitialFilters(products));
    setTypeFilter("all");
    setVisibleCount(pageSize);
  }, [products, query, pageSize]);

  useEffect(() => {
    if (!facets.typeOptions.includes(typeFilter)) {
      setTypeFilter("all");
    }
  }, [facets.typeOptions, typeFilter]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [filteredProducts, pageSize]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const catalogResetKey = `${query}-${sort}-${typeFilter}-${filters.brands.join(",")}-${filters.sizes.join(",")}-${filters.inStockOnly}-${filters.priceMin}-${filters.priceMax}`;

  const clearFilters = () => {
    setFilters(getInitialFilters(products));
    setTypeFilter("all");
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

  const filterProps = {
    route: searchResultsRoute,
    activeFilters: filters,
    priceBounds,
    availableBrands,
    showSizeFilter: facets.showSizeFilter,
    showBrandFilter: facets.showBrandFilter,
    showCategoryFilter: false,
    whiteFilterTriggers: true,
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
    <div className="site-container py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/50">
          <li>
            <Link
              href={localizedHref(locale, "/")}
              className="transition-colors hover:text-accent"
            >
              {dictionary.common.home}
            </Link>
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true">/</span>
            <span className="text-ink">{dictionary.search.pageTitle}</span>
          </li>
        </ol>
      </nav>

      <header className="mb-8 max-w-3xl">
        <p className="section-eyebrow">{dictionary.common.shop}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-10 gap-y-2 sm:gap-x-14 lg:gap-x-20">
          {hasQuery ? (
            <h1 className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-body text-sm font-medium normal-case tracking-normal text-ink/50">
                Results for
              </span>
              <span className="heading-category normal-case">
                &ldquo;{query}&rdquo;
              </span>
            </h1>
          ) : (
            <h1 className="heading-category">{dictionary.search.pageTitle}</h1>
          )}
          {hasQuery ? (
            <span className="inline-flex shrink-0 items-center rounded-full border border-ink/20 bg-white px-4 py-1.5 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1
                ? dictionary.search.match
                : dictionary.search.matches}
            </span>
          ) : null}
        </div>
        {!hasQuery ? (
          <p className="mt-3 text-base text-ink/70">{dictionary.search.minChars}</p>
        ) : null}
      </header>

      {hasQuery && products.length > 0 ? (
        <>
          <div className="mb-6 flex items-center justify-end gap-3 lg:hidden">
            <button
              type="button"
              className="inline-flex min-h-12 items-center gap-2.5 border border-ink/15 bg-white px-5 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-ink transition-colors hover:border-accent hover:text-accent"
              onClick={() => setMobileFiltersOpen(true)}
            >
              Filters
            </button>
            <CatalogSortSelect value={sort} onChange={setSort} />
          </div>

          <div className="mb-6 hidden lg:flex lg:flex-col lg:gap-4 lg:border-b lg:border-ink/10 lg:pb-5">
            {facets.showTypeFilter ? (
              <SearchTypeFilter
                options={facets.typeOptions}
                value={typeFilter}
                onChange={setTypeFilter}
                labels={typeFilterLabels}
              />
            ) : null}
            <div className="flex items-center gap-4">
              <CategoryFilters
                {...filterProps}
                variant="bar"
                embedded
                embeddedAlign="start"
                className="min-w-0 flex-1"
              />
              <CatalogSortSelect value={sort} onChange={setSort} />
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <>
              <CatalogProductGrid
                products={visibleProducts}
                listClassName="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-6 xl:gap-y-10"
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
              <p className="font-body text-sm font-bold uppercase tracking-aggressive text-ink">
                {dictionary.search.noMatches}
              </p>
              <p className="mt-2 max-w-sm text-sm text-ink/60">
                {dictionary.search.adjustFilters}
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 font-body text-[10px] font-bold uppercase tracking-aggressive text-accent"
              >
                Clear filters
              </button>
            </div>
          )}

          <MobileFilterDrawer
            open={mobileFiltersOpen}
            onClose={() => setMobileFiltersOpen(false)}
          >
            <div className="space-y-6 py-3">
              {facets.showTypeFilter ? (
                <SearchTypeFilter
                  options={facets.typeOptions}
                  value={typeFilter}
                  onChange={setTypeFilter}
                  labels={typeFilterLabels}
                />
              ) : null}
              <CategoryFilters {...filterProps} variant="drawer" />
            </div>
          </MobileFilterDrawer>
        </>
      ) : null}

      {hasQuery && products.length === 0 ? (
        <p className="py-12 font-body text-base text-ink/60">
          No products matched &ldquo;{query}&rdquo;. Try a different keyword or
          browse{" "}
          <Link href="/shop/equipment" className="text-accent hover:underline">
            equipment
          </Link>
          ,{" "}
          <Link href="/shop/motorcycles" className="text-accent hover:underline">
            motorcycles
          </Link>
          , or{" "}
          <Link href="/shop/tools" className="text-accent hover:underline">
            tools
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
