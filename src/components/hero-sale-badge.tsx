import { cn } from "@/lib/utils";

/** Clarity-style chevron badge (matches NewProductBadge shape). */
const BADGE_SHAPE_PATH =
  "M34.11,24.49l-3.92-6.62,3.88-6.35A1,1,0,0,0,33.22,10H2a2,2,0,0,0-2,2V24a2,2,0,0,0,2,2H33.25A1,1,0,0,0,34.11,24.49Z";

type HeroSaleBadgeProps = {
  untilLabel: string;
  ariaLabel: string;
  className?: string;
};

export function HeroSaleBadge({
  untilLabel,
  ariaLabel,
  className,
}: HeroSaleBadgeProps) {
  return (
    <div
      className={cn("flex flex-col items-center gap-1.5 sm:gap-2", className)}
    >
      <span
        role="status"
        aria-label={ariaLabel}
        className="inline-flex shrink-0 -rotate-6 transition-transform duration-300 motion-safe:group-hover:rotate-0"
      >
        <svg
          viewBox="0 0 36 36"
          className="h-11 w-auto drop-shadow-[0_8px_28px_rgb(255_104_19_/_0.8)] sm:h-14 lg:h-16 xl:h-[4.5rem]"
          aria-hidden="true"
        >
          <path className="fill-accent" d={BADGE_SHAPE_PATH} />
          <text
            x="16.2"
            y="18.4"
            fill="#FAF8F6"
            fontSize="9.5"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontFamily: "var(--font-racing-sans-one), system-ui, sans-serif",
              letterSpacing: "0.06em",
            }}
          >
            -10%
          </text>
        </svg>
      </span>
      <p className="font-body text-[9px] font-bold uppercase tracking-[0.18em] text-paper/85 sm:text-[10px]">
        {untilLabel}
      </p>
    </div>
  );
}
