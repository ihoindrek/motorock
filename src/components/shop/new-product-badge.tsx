"use client";

import { useDictionary } from "@/context/locale-context";

type NewProductBadgeProps = {
  variant?: "overlay" | "inline";
  className?: string;
};

/** Clarity-style banner with chevron tip (matches new-solid icon shape). */
const BADGE_SHAPE_PATH =
  "M34.11,24.49l-3.92-6.62,3.88-6.35A1,1,0,0,0,33.22,10H2a2,2,0,0,0-2,2V24a2,2,0,0,0,2,2H33.25A1,1,0,0,0,34.11,24.49Z";

function NewBadgeBanner({
  label,
  size = "md",
}: {
  label: string;
  size?: "sm" | "md";
}) {
  const heightClass = size === "sm" ? "h-7" : "h-8";

  return (
    <svg
      viewBox="0 0 36 36"
      className={`${heightClass} w-auto drop-shadow-[0_4px_14px_rgb(255_104_19_/_0.5)]`}
      aria-hidden="true"
    >
      <path className="fill-accent" d={BADGE_SHAPE_PATH} />
      <text
        x="16.2"
        y="18.2"
        fill="#FAF8F6"
        fontSize="9"
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontFamily: "var(--font-racing-sans-one), system-ui, sans-serif",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </text>
    </svg>
  );
}

export function NewProductBadge({
  variant = "inline",
  className = "",
}: NewProductBadgeProps) {
  const dict = useDictionary();
  const label = dict.motorcycle.newBadge;

  if (variant === "overlay") {
    return (
      <span
        className={`pointer-events-none absolute left-2 top-2 z-20 ${className}`}
        role="status"
        aria-label={label}
      >
        <NewBadgeBanner label={label} size="sm" />
      </span>
    );
  }

  return (
    <span className={`inline-flex ${className}`} role="status" aria-label={label}>
      <NewBadgeBanner label={label} size="md" />
    </span>
  );
}
