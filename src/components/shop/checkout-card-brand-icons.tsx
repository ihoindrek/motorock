"use client";

import { useState } from "react";
import {
  cardPaymentBrandAriaLabel,
  WOO_PAYMENTS_CHECKOUT_LOGOS,
  type CardPaymentBrand,
} from "@/lib/shop/card-payment-brands";
import { cn } from "@/lib/utils";

const logoClassName =
  "h-5 w-auto max-w-[2.125rem] flex-1 object-contain sm:h-6 sm:max-w-[2.25rem]";

export function CheckoutCardBrandIcons({
  brands = WOO_PAYMENTS_CHECKOUT_LOGOS,
  variant = "compact",
  className,
  "aria-label": ariaLabel = cardPaymentBrandAriaLabel(brands),
}: {
  brands?: readonly CardPaymentBrand[];
  variant?: "compact" | "row";
  className?: string;
  "aria-label"?: string;
}) {
  const [failedIds, setFailedIds] = useState<ReadonlySet<string>>(() => new Set());
  const visibleBrands = brands.filter((brand) => !failedIds.has(brand.id));

  if (visibleBrands.length === 0) {
    return null;
  }

  const handleError = (brandId: string) => {
    setFailedIds((current) => {
      if (current.has(brandId)) {
        return current;
      }

      return new Set([...current, brandId]);
    });
  };

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center gap-1 overflow-hidden sm:gap-1.5",
        variant === "compact"
          ? "h-9 w-[4.75rem] sm:h-10 sm:w-20"
          : "h-9 max-w-full sm:h-10",
        className,
      )}
      aria-label={ariaLabel}
      role="img"
    >
      {visibleBrands.map((brand) => (
        <img
          key={brand.id}
          src={brand.src}
          alt=""
          width={50}
          height={33}
          loading="lazy"
          decoding="async"
          className={logoClassName}
          onError={() => handleError(brand.id)}
        />
      ))}
    </span>
  );
}
