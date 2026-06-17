"use client";

import { useMemo, useState } from "react";
import type { ShippingRate } from "@/lib/shop/shipping-method";
import { parseShippingRateCost } from "@/lib/shop/shipping-method";
import {
  shippingGroupLabel,
  splitFeaturedShippingRates,
} from "@/lib/shop/shipping-rate-priority";
import { formatPrice } from "@/lib/shop/category";
import { ShippingMethodIcon } from "@/components/shop/shipping-method-icon";
import { cn } from "@/lib/utils";

function formatRatePrice(cost: string | null) {
  const value = parseShippingRateCost(cost);
  return value === 0 ? "Free" : formatPrice(value);
}

function ShippingRateButton({
  rate,
  selected,
  onSelect,
}: {
  rate: ShippingRate;
  selected: boolean;
  onSelect: (rateId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(rate.id)}
      className={cn(
        "flex w-full items-center gap-3 border px-3 py-2.5 text-left transition-colors sm:px-4 sm:py-3",
        selected
          ? "border-accent bg-accent/5"
          : "border-ink/15 bg-paper hover:border-ink/30",
      )}
    >
      <ShippingMethodIcon rate={rate} className="size-9 sm:size-10" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug text-ink">
          {rate.label}
        </span>
        <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-wide text-ink/45">
          {shippingGroupLabel(rate)}
        </span>
      </span>
      <span className="shrink-0 font-display text-sm font-bold tabular-nums">
        {formatRatePrice(rate.cost)}
      </span>
    </button>
  );
}

export function CheckoutShippingOptionsSkeleton() {
  return (
    <ul className="grid gap-2" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <li
          key={index}
          className="h-[58px] animate-pulse border border-ink/10 bg-surface/60 sm:h-[64px]"
        />
      ))}
    </ul>
  );
}

export function CheckoutShippingOptions({
  rates,
  selectedRateId,
  onSelect,
}: {
  rates: ShippingRate[];
  selectedRateId: string | null;
  onSelect: (rateId: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const { featured, rest, showToggle } = useMemo(
    () => splitFeaturedShippingRates(rates),
    [rates],
  );

  const visibleRates = showAll ? rates : featured;
  const selectedInRest = rest.some((rate) => rate.id === selectedRateId);

  return (
    <div>
      <ul className="grid gap-2">
        {visibleRates.map((rate) => (
          <li key={rate.id}>
            <ShippingRateButton
              rate={rate}
              selected={selectedRateId === rate.id}
              onSelect={onSelect}
            />
          </li>
        ))}
      </ul>

      {showToggle ? (
        <button
          type="button"
          onClick={() => setShowAll((open) => !open)}
          className="mt-3 text-sm font-medium text-ink/60 underline-offset-2 hover:text-accent hover:underline"
        >
          {showAll
            ? "Show fewer options"
            : `Show ${rest.length} more delivery option${rest.length === 1 ? "" : "s"}`}
          {!showAll && selectedInRest ? " (selected)" : ""}
        </button>
      ) : null}
    </div>
  );
}
