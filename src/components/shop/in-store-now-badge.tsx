type InStoreNowBadgeProps = {
  /** Absolute on product card image */
  variant?: "overlay" | "solid";
  className?: string;
};

const label = "In store now";

const solidBadgeClassName =
  "inline-flex items-center gap-1.5 bg-stock px-2.5 py-1 font-display text-[9px] font-bold uppercase tracking-aggressive text-paper shadow-[0_4px_14px_rgb(31_168_85_/_0.35)]";

export function InStoreNowBadge({
  variant = "solid",
  className = "",
}: InStoreNowBadgeProps) {
  return (
    <span
      className={`${solidBadgeClassName} ${
        variant === "overlay" ? "absolute right-3 top-3 z-20" : ""
      } ${className}`}
    >
      <span
        className="size-1.5 shrink-0 rounded-full bg-paper"
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
