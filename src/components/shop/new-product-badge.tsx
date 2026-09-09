"use client";

import { useDictionary } from "@/context/locale-context";
import { cn } from "@/lib/utils";

type NewProductBadgeProps = {
  variant?: "overlay" | "inline";
  className?: string;
};

export function NewProductBadge({
  variant = "inline",
  className = "",
}: NewProductBadgeProps) {
  const dict = useDictionary();
  const label = dict.motorcycle.newBadge;

  const pillClass = cn(
    "inline-flex items-center justify-center rounded-full bg-accent font-body font-bold uppercase tracking-aggressive text-white",
    variant === "overlay"
      ? "px-2.5 py-1 text-[9px]"
      : "px-3 py-1 text-[10px] sm:text-[11px]",
  );

  if (variant === "overlay") {
    return (
      <span
        className={cn(
          "pointer-events-none absolute left-2 top-2 z-20",
          className,
        )}
        role="status"
        aria-label={label}
      >
        <span className={pillClass}>{label}</span>
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex", className)}
      role="status"
      aria-label={label}
    >
      <span className={pillClass}>{label}</span>
    </span>
  );
}
