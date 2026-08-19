"use client";

import { useDictionary } from "@/context/locale-context";
import { resolveProductDiscountPercent } from "@/lib/shop/resolve-product-price";
import { cn } from "@/lib/utils";

type MotorcycleSaleBadgeProps = {
  price: number;
  regularPrice?: number;
  variant?: "overlay" | "inline" | "compact";
  className?: string;
};

const badgeClassName =
  "inline-flex items-center bg-accent font-body font-bold uppercase tracking-aggressive text-paper shadow-[0_4px_14px_rgb(255_104_19_/_0.45)]";

export function MotorcycleSaleBadge({
  price,
  regularPrice,
  variant = "inline",
  className,
}: MotorcycleSaleBadgeProps) {
  const dict = useDictionary();
  const percent = resolveProductDiscountPercent(price, regularPrice);

  if (percent === null) {
    return null;
  }

  const label = `-${percent}%`;
  const ariaLabel = dict.motorcycle.saleDiscountAria.replace(
    "{percent}",
    String(percent),
  );

  const sizeClassName =
    variant === "compact"
      ? "rounded-sm px-1.5 py-0.5 text-[10px]"
      : variant === "overlay"
        ? "rounded-sm px-2.5 py-1 text-[9px]"
        : "rounded-sm px-2.5 py-1 text-[10px] sm:text-[11px]";

  return (
    <span
      className={cn(
        badgeClassName,
        sizeClassName,
        variant === "overlay" && "pointer-events-none absolute right-3 bottom-3 z-20",
        className,
      )}
      role="status"
      aria-label={ariaLabel}
    >
      {label}
    </span>
  );
}
