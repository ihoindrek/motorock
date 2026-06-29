"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useCategoryTree } from "@/context/category-tree-context";
import { useDictionary, useLocale } from "@/context/locale-context";
import { PriceRangeSlider } from "@/components/shop/price-range-slider";
import { getEquipmentMegaMenu } from "@/i18n/navigation";
import { buildEquipmentCategoryHref } from "@/lib/shop/equipment-route";
import { localizedHref } from "@/i18n/paths";
import { allSizes } from "@/types/catalog-product";
import type { CategoryRoute } from "@/lib/shop/category";

export type ActiveFilters = {
  brands: string[];
  sizes: string[];
  inStockOnly: boolean;
  priceMin: number;
  priceMax: number;
};

type CategoryFiltersProps = {
  route: CategoryRoute;
  activeFilters: ActiveFilters;
  priceBounds: { min: number; max: number };
  availableBrands: readonly string[];
  showSizeFilter?: boolean;
  showBrandFilter?: boolean;
  showCategoryFilter?: boolean;
  variant?: "bar" | "drawer";
  embedded?: boolean;
  embeddedAlign?: "start" | "end";
  className?: string;
  whiteFilterTriggers?: boolean;
  onToggleBrand: (brand: string) => void;
  onToggleSize: (size: string) => void;
  onInStockChange: (value: boolean) => void;
  onPriceMinChange: (value: number) => void;
  onPriceMaxChange: (value: number) => void;
  onClear: () => void;
};

type OpenFilter = "category" | "brand" | "size" | "price" | null;

const filterTriggerBase =
  "inline-flex min-h-12 items-center gap-2.5 border px-5 py-3 font-body text-xs font-bold uppercase tracking-aggressive transition-colors";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={`size-4 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function FilterDropdown({
  label,
  activeCount,
  open,
  onToggle,
  panelClassName = "",
  whiteBackground = false,
  children,
}: {
  label: string;
  activeCount?: number;
  open: boolean;
  onToggle: () => void;
  panelClassName?: string;
  whiteBackground?: boolean;
  children: React.ReactNode;
}) {
  const panelId = useId();

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className={`${filterTriggerBase} ${
          whiteBackground ? "bg-white" : ""
        } ${
          open || (activeCount ?? 0) > 0
            ? "border-accent text-accent"
            : "border-ink/15 text-ink hover:border-accent hover:text-accent"
        }`}
      >
        {label}
        {(activeCount ?? 0) > 0 ? (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] leading-5 text-paper">
            {activeCount}
          </span>
        ) : null}
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <div
          id={panelId}
          className={`absolute left-0 top-full z-30 mt-3 border border-ink/10 bg-white p-5 shadow-[0_16px_40px_rgb(11_11_11_/_0.12)] ${panelClassName}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-ink/10 py-6">
      <h3 className="font-body text-xs font-bold uppercase tracking-aggressive text-ink/50">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BrandControls({
  brands,
  activeFilters,
  onToggleBrand,
}: {
  brands: readonly string[];
  activeFilters: ActiveFilters;
  onToggleBrand: (brand: string) => void;
}) {
  return (
    <ul className="min-w-[13rem] space-y-3">
      {brands.map((brand) => (
        <li key={brand}>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-base text-ink">
            <input
              type="checkbox"
              checked={activeFilters.brands.includes(brand)}
              onChange={() => onToggleBrand(brand)}
              className="size-5 accent-accent"
            />
            {brand}
          </label>
        </li>
      ))}
    </ul>
  );
}

function SizeControls({
  activeFilters,
  onToggleSize,
}: {
  activeFilters: ActiveFilters;
  onToggleSize: (size: string) => void;
}) {
  return (
    <div className="grid max-w-[18rem] grid-cols-4 gap-2 sm:max-w-none sm:grid-cols-5">
      {allSizes.map((size) => {
        const selected = activeFilters.sizes.includes(size);

        return (
          <button
            key={size}
            type="button"
            onClick={() => onToggleSize(size)}
            className={`min-h-11 min-w-11 border px-3 py-2.5 font-body text-xs font-bold uppercase tracking-wide transition-colors ${
              selected
                ? "border-accent bg-accent text-paper"
                : "border-ink/15 bg-white text-ink hover:border-accent hover:text-accent"
            }`}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
}

function PriceControls({
  variant,
  activeFilters,
  priceBounds,
  onPriceMinChange,
  onPriceMaxChange,
}: {
  variant: "bar" | "drawer";
  activeFilters: ActiveFilters;
  priceBounds: { min: number; max: number };
  onPriceMinChange: (value: number) => void;
  onPriceMaxChange: (value: number) => void;
}) {
  const dict = useDictionary();
  const inputClassName =
    "w-full border border-ink/15 bg-white px-4 py-3 font-body text-sm font-bold text-ink transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  const clampMin = (value: number) =>
    Math.min(Math.max(value, priceBounds.min), activeFilters.priceMax);
  const clampMax = (value: number) =>
    Math.max(Math.min(value, priceBounds.max), activeFilters.priceMin);

  return (
    <div className={`space-y-5 ${variant === "bar" ? "min-w-[20rem]" : ""}`}>
      <PriceRangeSlider
        bounds={priceBounds}
        value={[activeFilters.priceMin, activeFilters.priceMax]}
        onValueChange={([min, max]) => {
          onPriceMinChange(min);
          onPriceMaxChange(max);
        }}
      />

      <div className="flex items-center gap-3">
        <label className="sr-only" htmlFor={`price-min-${variant}`}>
          {dict.catalog.minPrice}
        </label>
        <input
          id={`price-min-${variant}`}
          type="number"
          min={priceBounds.min}
          max={activeFilters.priceMax}
          value={activeFilters.priceMin}
          onChange={(event) =>
            onPriceMinChange(clampMin(Number(event.target.value)))
          }
          className={inputClassName}
        />
        <span className="font-body text-xs font-bold text-ink/25" aria-hidden="true">
          —
        </span>
        <label className="sr-only" htmlFor={`price-max-${variant}`}>
          {dict.catalog.maxPrice}
        </label>
        <input
          id={`price-max-${variant}`}
          type="number"
          min={activeFilters.priceMin}
          max={priceBounds.max}
          value={activeFilters.priceMax}
          onChange={(event) =>
            onPriceMaxChange(clampMax(Number(event.target.value)))
          }
          className={inputClassName}
        />
      </div>
    </div>
  );
}

export function CategoryFilters({
  route,
  activeFilters,
  priceBounds,
  availableBrands,
  showSizeFilter = true,
  showBrandFilter = true,
  showCategoryFilter = true,
  variant = "bar",
  embedded = false,
  embeddedAlign = "end",
  className = "",
  whiteFilterTriggers = false,
  onToggleBrand,
  onToggleSize,
  onInStockChange,
  onPriceMinChange,
  onPriceMaxChange,
  onClear,
}: CategoryFiltersProps) {
  const dict = useDictionary();
  const locale = useLocale();
  const categoryTree = useCategoryTree();
  const equipmentMegaMenu = useMemo(
    () => getEquipmentMegaMenu(locale, dict, categoryTree),
    [locale, dict, categoryTree],
  );
  const barRef = useRef<HTMLDivElement>(null);
  const [openFilter, setOpenFilter] = useState<OpenFilter>(null);

  const showGenderNav =
    !route.gender &&
    !route.category &&
    !route.protectionOnly &&
    !route.accessoriesOnly;
  const isMotorcycleCatalog = route.category === "motorcycles";
  const availabilityFilterLabel = isMotorcycleCatalog
    ? dict.catalog.inStore
    : dict.catalog.inStock;
  const availabilityFilterDrawerLabel = isMotorcycleCatalog
    ? dict.catalog.inStoreOnly
    : dict.catalog.inStockOnly;
  const showSubcategoryNav = !route.category && route.gender;
  const showCategoryDropdown =
    showCategoryFilter && (showGenderNav || showSubcategoryNav);

  const priceIsActive =
    activeFilters.priceMin > priceBounds.min ||
    activeFilters.priceMax < priceBounds.max;

  const activeFilterCount =
    activeFilters.brands.length +
    activeFilters.sizes.length +
    (activeFilters.inStockOnly ? 1 : 0) +
    (priceIsActive ? 1 : 0);

  const toggleFilter = (filter: OpenFilter) => {
    setOpenFilter((current) => (current === filter ? null : filter));
  };

  useEffect(() => {
    if (variant !== "bar" || !openFilter) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!barRef.current?.contains(event.target as Node)) {
        setOpenFilter(null);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenFilter(null);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openFilter, variant]);

  const categoryLinks = showGenderNav ? (
    <ul className="min-w-[14rem] space-y-3">
      {equipmentMegaMenu.columns.slice(0, 2).map((column) => (
        <li key={column.title}>
          <Link
            href={column.viewAll.href}
            className="block py-1 text-base font-medium text-ink transition-colors hover:text-accent"
            onClick={() => setOpenFilter(null)}
          >
            {column.title}
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={localizedHref(locale, buildEquipmentCategoryHref("protection"))}
          className="block py-1 text-base font-medium text-ink transition-colors hover:text-accent"
          onClick={() => setOpenFilter(null)}
        >
          {dict.catalog.protectionSafety}
        </Link>
      </li>
      <li>
        <Link
          href={localizedHref(locale, buildEquipmentCategoryHref("accessories"))}
          className="block py-1 text-base font-medium text-ink transition-colors hover:text-accent"
          onClick={() => setOpenFilter(null)}
        >
          {dict.nav.accessories}
        </Link>
      </li>
    </ul>
  ) : (
    <ul className="min-w-[14rem] space-y-3">
      {equipmentMegaMenu.columns
        .find((column) => column.id === (route.gender === "men" ? "men" : "women"))
        ?.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block py-1 text-base font-medium text-ink transition-colors hover:text-accent"
              onClick={() => setOpenFilter(null)}
            >
              {link.label}
            </Link>
          </li>
        ))}
    </ul>
  );

  const triggerWhiteBackground = whiteFilterTriggers || embedded;

  if (variant === "bar") {
    return (
      <div
        ref={barRef}
        className={`flex flex-wrap items-center gap-3 ${className} ${
          embedded
            ? embeddedAlign === "start"
              ? "justify-start"
              : "justify-end"
            : "justify-between gap-4 border-b border-ink/10 pb-5"
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          {showCategoryDropdown ? (
            <FilterDropdown
              label={dict.catalog.category}
              open={openFilter === "category"}
              onToggle={() => toggleFilter("category")}
              whiteBackground={triggerWhiteBackground}
            >
              {categoryLinks}
            </FilterDropdown>
          ) : null}

          {showBrandFilter ? (
            <FilterDropdown
              label={dict.catalog.brand}
              activeCount={activeFilters.brands.length}
              open={openFilter === "brand"}
              onToggle={() => toggleFilter("brand")}
              whiteBackground={triggerWhiteBackground}
            >
              <BrandControls
                brands={availableBrands}
                activeFilters={activeFilters}
                onToggleBrand={onToggleBrand}
              />
            </FilterDropdown>
          ) : null}

          {showSizeFilter ? (
            <FilterDropdown
              label={dict.catalog.size}
              activeCount={activeFilters.sizes.length}
              open={openFilter === "size"}
              onToggle={() => toggleFilter("size")}
              panelClassName="min-w-[18rem]"
              whiteBackground={triggerWhiteBackground}
            >
              <SizeControls
                activeFilters={activeFilters}
                onToggleSize={onToggleSize}
              />
            </FilterDropdown>
          ) : null}

          <FilterDropdown
            label={dict.catalog.price}
            activeCount={priceIsActive ? 1 : 0}
            open={openFilter === "price"}
            onToggle={() => toggleFilter("price")}
            whiteBackground={triggerWhiteBackground}
          >
            <PriceControls
              variant="bar"
              activeFilters={activeFilters}
              priceBounds={priceBounds}
              onPriceMinChange={onPriceMinChange}
              onPriceMaxChange={onPriceMaxChange}
            />
          </FilterDropdown>

          <button
            type="button"
            onClick={() => onInStockChange(!activeFilters.inStockOnly)}
            className={`${filterTriggerBase} ${
              activeFilters.inStockOnly
                ? "border-stock bg-stock text-paper"
                : triggerWhiteBackground
                  ? "border-ink/15 bg-white text-ink hover:border-stock hover:text-stock"
                  : "border-ink/15 text-ink hover:border-stock hover:text-stock"
            }`}
          >
            {availabilityFilterLabel}
          </button>
        </div>

        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={() => {
              onClear();
              setOpenFilter(null);
            }}
            className="min-h-12 font-body text-xs font-bold uppercase tracking-aggressive text-ink/50 transition-colors hover:text-accent"
          >
            {dict.catalog.clearAll} ({activeFilterCount})
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-ink/10 pb-5">
        <p className="font-body text-sm font-bold uppercase tracking-aggressive text-ink">
          {dict.catalog.filters}
        </p>
        <button
          type="button"
          onClick={onClear}
          className="font-body text-xs font-bold uppercase tracking-aggressive text-ink/50 transition-colors hover:text-accent"
        >
          {dict.catalog.clearAll}
        </button>
      </div>

      {showCategoryDropdown ? (
        <FilterSection title={dict.catalog.category}>{categoryLinks}</FilterSection>
      ) : null}

      {showBrandFilter ? (
        <FilterSection title={dict.catalog.brand}>
          <BrandControls
            brands={availableBrands}
            activeFilters={activeFilters}
            onToggleBrand={onToggleBrand}
          />
        </FilterSection>
      ) : null}

      {showSizeFilter ? (
        <FilterSection title={dict.catalog.size}>
          <SizeControls
            activeFilters={activeFilters}
            onToggleSize={onToggleSize}
          />
        </FilterSection>
      ) : null}

      <FilterSection title={dict.catalog.price}>
        <PriceControls
          variant="drawer"
          activeFilters={activeFilters}
          priceBounds={priceBounds}
          onPriceMinChange={onPriceMinChange}
          onPriceMaxChange={onPriceMaxChange}
        />
      </FilterSection>

      <FilterSection title={dict.catalog.availability}>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-base text-ink">
          <input
            type="checkbox"
            checked={activeFilters.inStockOnly}
            onChange={(event) => onInStockChange(event.target.checked)}
            className="size-5 accent-stock"
          />
          {availabilityFilterDrawerLabel}
        </label>
      </FilterSection>
    </div>
  );
}
