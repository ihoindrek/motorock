"use client";

import { useState } from "react";
import {
  cardPaymentBrandAriaLabel,
  WOO_PAYMENTS_CHECKOUT_LOGOS,
  type CardPaymentBrand,
} from "@/lib/shop/card-payment-brands";
import { cn } from "@/lib/utils";

const imageSizeClassName = {
  sm: "max-h-[0.85rem] max-w-full",
  md: "max-h-[1rem] max-w-full",
} as const;

export function CheckoutCardBrandIcons({
  brands = WOO_PAYMENTS_CHECKOUT_LOGOS,
  size = "md",
  variant = "compact",
  className,
  "aria-label": ariaLabel = cardPaymentBrandAriaLabel(brands),
}: {
  brands?: readonly CardPaymentBrand[];
  size?: keyof typeof imageSizeClassName;
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

  if (variant === "row") {
    return (
      <ul
        className={cn(
          "m-0 flex list-none flex-wrap items-center gap-1.5 p-0",
          className,
        )}
        aria-label={ariaLabel}
      >
        {visibleBrands.map((brand) => (
          <li key={brand.id}>
            <span className="flex h-7 min-w-[2.75rem] items-center justify-center rounded-sm border border-ink/10 bg-ink/[0.02] px-2">
              <img
                src={brand.src}
                alt=""
                width={40}
                height={24}
                loading="lazy"
                decoding="async"
                className={cn("block w-auto object-contain", imageSizeClassName[size])}
                onError={() => handleError(brand.id)}
              />
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul
      className={cn("m-0 grid list-none grid-cols-3 gap-1 p-0", className)}
      aria-label={ariaLabel}
    >
      {visibleBrands.map((brand) => (
        <li key={brand.id}>
          <span className="flex h-7 items-center justify-center rounded-sm border border-ink/10 bg-ink/[0.02] px-1.5">
            <img
              src={brand.src}
              alt=""
              width={40}
              height={24}
              loading="lazy"
              decoding="async"
              className={cn("block w-auto object-contain", imageSizeClassName[size])}
              onError={() => handleError(brand.id)}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
