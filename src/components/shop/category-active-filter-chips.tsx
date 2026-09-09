"use client";

import { X } from "lucide-react";
import type { ActiveFilters } from "@/components/shop/category-filters";
import { useDictionary, useLocale } from "@/context/locale-context";
import type { BrandGenderFilterId } from "@/lib/shop/brand-gender-filter";
import { formatPrice } from "@/lib/shop/category";
import { formatDisplacementLabel } from "@/lib/shop/motorcycle-displacement";
import type { ProductCategory } from "@/types/catalog-product";
import { cn } from "@/lib/utils";

type FilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

export type CategoryActiveFilterChipsProps = {
  activeFilters: ActiveFilters;
  priceBounds: { min: number; max: number };
  resultCount: number;
  isMotorcycleCatalog?: boolean;
  categoryOptions?: readonly { id: ProductCategory; label: string }[];
  genderOptions?: readonly { id: BrandGenderFilterId; label: string }[];
  className?: string;
  onToggleBrand: (brand: string) => void;
  onToggleSize: (size: string) => void;
  onToggleCategory?: (category: ProductCategory) => void;
  onToggleGender?: (gender: BrandGenderFilterId) => void;
  onToggleDisplacement?: (displacement: number) => void;
  onInStockChange: (value: boolean) => void;
  onPriceReset: () => void;
  onClear: () => void;
};

function buildFilterChips({
  activeFilters,
  priceBounds,
  isMotorcycleCatalog = false,
  categoryOptions = [],
  genderOptions = [],
  locale,
  dict,
  onToggleBrand,
  onToggleSize,
  onToggleCategory,
  onToggleGender,
  onToggleDisplacement,
  onInStockChange,
  onPriceReset,
}: Omit<CategoryActiveFilterChipsProps, "resultCount" | "className" | "onClear"> & {
  locale: "en" | "et";
  dict: ReturnType<typeof useDictionary>;
}): FilterChip[] {
  const chips: FilterChip[] = [];

  for (const brand of activeFilters.brands) {
    chips.push({
      key: `brand-${brand}`,
      label: brand,
      onRemove: () => onToggleBrand(brand),
    });
  }

  for (const size of activeFilters.sizes) {
    chips.push({
      key: `size-${size}`,
      label: size,
      onRemove: () => onToggleSize(size),
    });
  }

  if (onToggleCategory) {
    for (const category of activeFilters.categories) {
      const label =
        categoryOptions.find((option) => option.id === category)?.label ??
        category;
      chips.push({
        key: `category-${category}`,
        label,
        onRemove: () => onToggleCategory(category),
      });
    }
  }

  if (onToggleGender) {
    for (const gender of activeFilters.genders) {
      const label =
        genderOptions.find((option) => option.id === gender)?.label ?? gender;
      chips.push({
        key: `gender-${gender}`,
        label,
        onRemove: () => onToggleGender(gender),
      });
    }
  }

  if (onToggleDisplacement) {
    for (const displacement of activeFilters.displacements) {
      chips.push({
        key: `displacement-${displacement}`,
        label: formatDisplacementLabel(displacement, locale),
        onRemove: () => onToggleDisplacement(displacement),
      });
    }
  }

  if (activeFilters.inStockOnly) {
    chips.push({
      key: "in-stock",
      label: isMotorcycleCatalog
        ? dict.catalog.inStoreOnly
        : dict.catalog.inStockOnly,
      onRemove: () => onInStockChange(false),
    });
  }

  const priceIsActive =
    activeFilters.priceMin > priceBounds.min ||
    activeFilters.priceMax < priceBounds.max;

  if (priceIsActive) {
    chips.push({
      key: "price",
      label: `${formatPrice(activeFilters.priceMin, locale)} – ${formatPrice(activeFilters.priceMax, locale)}`,
      onRemove: onPriceReset,
    });
  }

  return chips;
}

export function CategoryActiveFilterChips({
  activeFilters,
  priceBounds,
  resultCount,
  isMotorcycleCatalog = false,
  categoryOptions = [],
  genderOptions = [],
  className,
  onToggleBrand,
  onToggleSize,
  onToggleCategory,
  onToggleGender,
  onToggleDisplacement,
  onInStockChange,
  onPriceReset,
  onClear,
}: CategoryActiveFilterChipsProps) {
  const dict = useDictionary();
  const locale = useLocale();

  const chips = buildFilterChips({
    activeFilters,
    priceBounds,
    isMotorcycleCatalog,
    categoryOptions,
    genderOptions,
    locale,
    dict,
    onToggleBrand,
    onToggleSize,
    onToggleCategory,
    onToggleGender,
    onToggleDisplacement,
    onInStockChange,
    onPriceReset,
  });

  if (chips.length === 0) {
    return null;
  }

  const resultLabel =
    resultCount === 1
      ? dict.catalog.productSingular
      : dict.catalog.productPlural;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-ink/10 pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="sr-only">{dict.catalog.activeFilters}</p>
        <ul className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li key={chip.key}>
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={dict.catalog.removeFilterAria.replace(
                  "{filter}",
                  chip.label,
                )}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 py-1.5 font-body text-[11px] font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
              >
                <span className="truncate">{chip.label}</span>
                <X className="size-3 shrink-0" strokeWidth={2} aria-hidden="true" />
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex min-h-8 items-center px-2 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45 transition-colors hover:text-accent"
            >
              {dict.catalog.clearAll}
            </button>
          </li>
        </ul>
      </div>

      <p
        aria-live="polite"
        aria-atomic="true"
        className="shrink-0 font-body text-xs font-bold uppercase tracking-aggressive text-ink/55"
      >
        <span className="text-ink">{resultCount}</span> {resultLabel}
      </p>
    </div>
  );
}
