"use client";

import { ShippingMethodIcon } from "@/components/shop/shipping-method-icon";
import type { ShippingRate } from "@/lib/shop/shipping-method";
import {
  dedupeShippingRatesByVisual,
  shippingVisualAriaLabel,
  shippingVisualDedupeKey,
} from "@/lib/shop/shipping-method-visual";
import { cn } from "@/lib/utils";

type ProductShippingCarrierIconsProps = {
  rates: readonly Pick<ShippingRate, "id" | "label" | "methodId">[];
  className?: string;
};

export function ProductShippingCarrierIcons({
  rates,
  className,
}: ProductShippingCarrierIconsProps) {
  const carriers = dedupeShippingRatesByVisual(rates);

  if (carriers.length === 0) {
    return null;
  }

  return (
    <ul
      className={cn("flex flex-wrap items-center gap-3", className)}
      aria-label="Delivery carriers"
    >
      {carriers.map((rate) => (
        <li key={shippingVisualDedupeKey(rate)}>
          <span
            className="inline-flex items-center"
            title={shippingVisualAriaLabel(rate)}
          >
            <span className="sr-only">{shippingVisualAriaLabel(rate)}</span>
            <ShippingMethodIcon
              rate={{
                id: rate.id,
                label: rate.label,
                methodId: rate.methodId,
                cost: null,
                instanceId: null,
              }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
