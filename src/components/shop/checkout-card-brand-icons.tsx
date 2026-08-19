"use client";

import { useState } from "react";
import {
  cardPaymentBrandAriaLabel,
  WOO_PAYMENTS_CHECKOUT_LOGOS,
  type CardPaymentBrand,
} from "@/lib/shop/card-payment-brands";
import { cn } from "@/lib/utils";

const sizeClassName = {
  sm: "h-5 w-auto shrink-0 sm:h-[1.35rem]",
  md: "h-6 w-auto shrink-0 sm:h-7",
} as const;

export function CheckoutCardBrandIcons({
  brands = WOO_PAYMENTS_CHECKOUT_LOGOS,
  size = "md",
  className,
  scrollable = false,
  "aria-label": ariaLabel = cardPaymentBrandAriaLabel(brands),
}: {
  brands?: readonly CardPaymentBrand[];
  size?: keyof typeof sizeClassName;
  className?: string;
  scrollable?: boolean;
  "aria-label"?: string;
}) {
  const [failedIds, setFailedIds] = useState<ReadonlySet<string>>(() => new Set());
  const visibleBrands = brands.filter((brand) => !failedIds.has(brand.id));

  if (visibleBrands.length === 0) {
    return null;
  }

  return (
    <ul
      className={cn(
        "m-0 flex list-none flex-row flex-nowrap items-center gap-1.5 p-0 sm:gap-2",
        scrollable && "overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      aria-label={ariaLabel}
    >
      {visibleBrands.map((brand) => (
        <li key={brand.id} className="shrink-0">
          <img
            src={brand.src}
            alt=""
            width={64}
            height={40}
            loading="lazy"
            decoding="async"
            className={cn("block object-contain", sizeClassName[size])}
            onError={() => {
              setFailedIds((current) => {
                if (current.has(brand.id)) {
                  return current;
                }

                return new Set([...current, brand.id]);
              });
            }}
          />
        </li>
      ))}
    </ul>
  );
}
