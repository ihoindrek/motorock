"use client";

import { useDictionary } from "@/context/locale-context";
import { cn } from "@/lib/utils";

type MotorcycleBrandLogoFilterProps = {
  brands: readonly string[];
  selectedBrand: string | null;
  onSelectBrand: (brand: string | null) => void;
  layout?: "stacked" | "inline";
  className?: string;
  /** Matches parent section background for the scroll fade edge. */
  fadeTone?: "paper" | "moto";
};

const selectedBrandGlow =
  "pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1/2 bg-[radial-gradient(ellipse_70%_100%_at_50%_100%,rgb(255_90_0_/_0.48),transparent_68%)]";

function BrandLogoButton({
  brand,
  selected,
  onClick,
  compact,
  filterByBrandLabel,
}: {
  brand: string;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
  filterByBrandLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={filterByBrandLabel}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl font-body text-[10px] font-bold uppercase tracking-aggressive transition-all duration-200 sm:text-xs",
        compact
          ? "h-12 min-w-[4.75rem] px-3"
          : "h-14 min-w-[5.5rem] px-4 sm:h-16 sm:min-w-[6.5rem] sm:px-5",
        selected
          ? "bg-ink text-paper"
          : "bg-paper text-ink/70 hover:text-ink hover:shadow-[0_8px_24px_-16px_rgba(11,11,11,0.15)]",
      )}
    >
      {selected ? <span aria-hidden="true" className={selectedBrandGlow} /> : null}
      <span className="relative z-10">{brand}</span>
    </button>
  );
}

export function MotorcycleBrandLogoFilter({
  brands,
  selectedBrand,
  onSelectBrand,
  layout = "stacked",
  className = "",
  fadeTone = "paper",
}: MotorcycleBrandLogoFilterProps) {
  const dict = useDictionary();

  if (brands.length === 0) {
    return null;
  }

  const isInline = layout === "inline";
  const fadeFrom = fadeTone === "moto" ? "from-moto" : "from-paper";
  const fadeVia = fadeTone === "moto" ? "via-moto/90" : "via-paper/90";

  return (
    <div className={isInline ? className : `mb-8 ${className}`.trim()}>
      {!isInline ? (
        <p className="font-body text-xs font-bold uppercase tracking-aggressive text-ink/45">
          {dict.catalog.brand}
        </p>
      ) : null}
      <div className="relative">
      <ul
        className={`flex gap-2 overflow-x-auto scroll-smooth pb-1 pr-10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          isInline ? "" : "mt-3"
        }`}
      >
        <li className="shrink-0">
          <button
            type="button"
            onClick={() => onSelectBrand(null)}
            aria-pressed={selectedBrand === null}
            className={cn(
              "relative flex items-center justify-center overflow-hidden rounded-xl font-body text-[10px] font-bold uppercase tracking-aggressive transition-all duration-200 sm:text-xs",
              isInline
                ? "h-12 min-w-[4.75rem] px-3"
                : "h-14 min-w-[5.5rem] px-4 sm:h-16 sm:min-w-[6.5rem]",
              selectedBrand === null
                ? "bg-ink text-paper"
                : "bg-paper text-ink/60 hover:text-ink hover:shadow-[0_8px_24px_-16px_rgba(11,11,11,0.15)]",
            )}
          >
            {selectedBrand === null ? (
              <span aria-hidden="true" className={selectedBrandGlow} />
            ) : null}
            <span className="relative z-10">{dict.search.all}</span>
          </button>
        </li>
        {brands.map((brand) => (
          <li key={brand} className="shrink-0">
            <BrandLogoButton
              brand={brand}
              selected={selectedBrand === brand}
              compact={isInline}
              filterByBrandLabel={dict.motorcycle.filterByBrand.replace(
                "{brand}",
                brand,
              )}
              onClick={() =>
                onSelectBrand(selectedBrand === brand ? null : brand)
              }
            />
          </li>
        ))}
      </ul>
      {!isInline ? (
        <>
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 flex w-14 items-center justify-end bg-gradient-to-l to-transparent pl-2",
              fadeFrom,
              fadeVia,
            )}
          >
            <span className="font-body text-sm font-bold text-ink/35">→</span>
          </div>
          <p className="mt-2 font-body text-[9px] font-bold uppercase tracking-aggressive text-ink/40">
            {dict.catalog.scrollBrandsHint}
          </p>
        </>
      ) : null}
      </div>
    </div>
  );
}
