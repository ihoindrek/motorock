"use client";

import { useState } from "react";
import {
  cardPaymentBrandAriaLabel,
  WOO_PAYMENTS_CHECKOUT_LOGOS,
  type CardPaymentBrand,
} from "@/lib/shop/card-payment-brands";
import { cn } from "@/lib/utils";

/** Card-badge SVGs are ~1.5:1; size by height and preserve full width. */
const logoClassName = "h-6 w-auto shrink-0 object-contain sm:h-7";

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
        "flex shrink-0 items-center gap-1 sm:gap-1.5",
        variant === "compact" && "min-w-[7.25rem] sm:min-w-[8rem]",
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
          width={58}
          height={40}
          loading="lazy"
          decoding="async"
          className={logoClassName}
          onError={() => handleError(brand.id)}
        />
      ))}
    </span>
  );
}
