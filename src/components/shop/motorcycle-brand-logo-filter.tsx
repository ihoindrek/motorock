import Image from "next/image";
import { getBrandByName } from "@/lib/shop/brands";
import { cn } from "@/lib/utils";

type MotorcycleBrandLogoFilterProps = {
  brands: readonly string[];
  selectedBrand: string | null;
  onSelectBrand: (brand: string | null) => void;
  layout?: "stacked" | "inline";
  className?: string;
};

const selectedBrandGlow =
  "pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1/2 bg-[radial-gradient(ellipse_70%_100%_at_50%_100%,rgb(255_90_0_/_0.48),transparent_68%)]";

function BrandLogoButton({
  brand,
  selected,
  onClick,
  compact,
}: {
  brand: string;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const config = getBrandByName(brand);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`Filter by ${brand}`}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl transition-all duration-200",
        compact
          ? "h-12 min-w-[4.75rem] px-3"
          : "h-14 min-w-[5.5rem] px-4 sm:h-16 sm:min-w-[6.5rem] sm:px-5",
        selected
          ? "bg-ink"
          : "bg-paper hover:shadow-[0_8px_24px_-16px_rgba(11,11,11,0.15)]",
      )}
    >
      {selected ? <span aria-hidden="true" className={selectedBrandGlow} /> : null}
      {config?.logo ? (
        <Image
          src={config.logo}
          alt=""
          width={config.width ?? 120}
          height={config.height ?? 36}
          className={cn(
            "relative z-10 h-5 w-auto max-w-[88px] object-contain transition-[filter] duration-200 sm:h-6 sm:max-w-[100px]",
            selected ? "brightness-0 invert" : "brightness-0",
          )}
        />
      ) : (
        <span
          className={cn(
            "relative z-10 font-body text-[10px] font-bold uppercase tracking-aggressive sm:text-xs",
            selected ? "text-paper" : "text-ink",
          )}
        >
          {brand}
        </span>
      )}
    </button>
  );
}

export function MotorcycleBrandLogoFilter({
  brands,
  selectedBrand,
  onSelectBrand,
  layout = "stacked",
  className = "",
}: MotorcycleBrandLogoFilterProps) {
  if (brands.length === 0) {
    return null;
  }

  const isInline = layout === "inline";

  return (
    <div className={isInline ? className : `mb-8 ${className}`.trim()}>
      {!isInline ? (
        <p className="font-body text-xs font-bold uppercase tracking-aggressive text-ink/45">
          Brand
        </p>
      ) : null}
      <ul
        className={`flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
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
            <span className="relative z-10">All</span>
          </button>
        </li>
        {brands.map((brand) => (
          <li key={brand} className="shrink-0">
            <BrandLogoButton
              brand={brand}
              selected={selectedBrand === brand}
              compact={isInline}
              onClick={() =>
                onSelectBrand(selectedBrand === brand ? null : brand)
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
