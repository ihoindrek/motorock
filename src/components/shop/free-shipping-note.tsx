"use client";

import { FREE_SHIPPING_THRESHOLD_EUR } from "@/data/storefront-policies";
import { useDictionary, useLocale } from "@/context/locale-context";
import { formatPrice } from "@/lib/shop/category";
import {
  freeShippingProgressPercent,
  freeShippingRemainingAmount,
  qualifiesForFreeShipping,
} from "@/lib/shop/free-shipping";
import { cn } from "@/lib/utils";

type FreeShippingNoteProps = {
  subtotal?: number;
  variant?: "static" | "progress";
  className?: string;
};

export function FreeShippingNote({
  subtotal,
  variant = "static",
  className,
}: FreeShippingNoteProps) {
  const locale = useLocale();
  const dict = useDictionary();
  const thresholdLabel = formatPrice(FREE_SHIPPING_THRESHOLD_EUR, locale);

  if (variant === "static" || subtotal === undefined) {
    return (
      <p className={cn("text-xs font-bold leading-relaxed text-ink/70", className)}>
        {dict.pdp.shippingFreeFromThreshold.replace("{amount}", thresholdLabel)}
      </p>
    );
  }

  if (qualifiesForFreeShipping(subtotal)) {
    return (
      <p className={cn("text-xs font-medium text-accent", className)}>
        {dict.pdp.shippingFreeUnlocked}
      </p>
    );
  }

  const remaining = formatPrice(freeShippingRemainingAmount(subtotal), locale);
  const progress = freeShippingProgressPercent(subtotal);

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-xs text-ink/55">
        {dict.pdp.shippingFreeRemaining.replace("{amount}", remaining)}
      </p>
      <div
        className="h-1 overflow-hidden rounded-full bg-ink/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={FREE_SHIPPING_THRESHOLD_EUR}
        aria-valuenow={Math.round(subtotal)}
        aria-label={dict.pdp.shippingFreeFromThreshold.replace(
          "{amount}",
          thresholdLabel,
        )}
      >
        <div
          className="h-full bg-accent transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
