"use client";

import { useDictionary } from "@/context/locale-context";
import { isFinancingAvailable } from "@/data/financing";
import { useVisitorCountry } from "@/hooks/use-visitor-country";
import {
  getInbankCalculatorConfig,
  isInbankCalculatorAmount,
} from "@/lib/montonio/inbank-calculator";
import { MotorcyclePrice } from "@/components/shop/motorcycle-price";
import { Price } from "@/components/shop/price";
import { MontonioFinancingCalculator } from "@/components/shop/montonio-financing-calculator";
import type { ComponentProps } from "react";

type FinancingPriceTeaserProps = {
  price: number;
  regularPrice?: number;
  variant?: "hero" | "compact";
  priceVariant?: ComponentProps<typeof Price>["variant"];
  className?: string;
  /** Override geo-detected country (e.g. tests). */
  countryCode?: string;
};

export function FinancingPriceTeaser({
  price,
  regularPrice,
  variant = "hero",
  priceVariant,
  className,
  countryCode,
}: FinancingPriceTeaserProps) {
  const dict = useDictionary();
  const { country: visitorCountry, loading: geoLoading } = useVisitorCountry();
  const config = getInbankCalculatorConfig();
  const resolvedPriceVariant = priceVariant ?? (variant === "hero" ? "xl" : "md");
  const resolvedCountry = countryCode ?? visitorCountry;
  const geoReady = countryCode !== undefined || !geoLoading;
  const showCalculator =
    geoReady &&
    config.enabled &&
    isFinancingAvailable(resolvedCountry) &&
    isInbankCalculatorAmount(price) &&
    price > 0;

  const financing = showCalculator ? (
    <MontonioFinancingCalculator
      amount={price}
      countryCode={resolvedCountry ?? undefined}
      eyebrow={dict.financing.finance}
      calculateLabel={dict.financing.calculateFinancing}
    />
  ) : null;

  if (variant === "compact") {
    return (
      <div className={className}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:flex-nowrap">
          <div className="shrink-0">
            {regularPrice ? (
              <MotorcyclePrice
                price={price}
                regularPrice={regularPrice}
                variant={resolvedPriceVariant}
                showDiscountBadge
              />
            ) : (
              <Price value={price} variant={resolvedPriceVariant} />
            )}
          </div>
          {financing ? (
            <>
              <div
                className="hidden h-5 w-px shrink-0 bg-ink/10 sm:block"
                aria-hidden="true"
              />
              <div className="min-w-0 shrink">{financing}</div>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-start gap-x-2 gap-y-1 sm:flex-nowrap">
        <div className="shrink-0">
          <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
            {dict.financing.retail}
          </p>
          <p className="mt-0.5">
            {regularPrice ? (
              <MotorcyclePrice
                price={price}
                regularPrice={regularPrice}
                variant={resolvedPriceVariant}
                showDiscountBadge
              />
            ) : (
              <Price value={price} variant={resolvedPriceVariant} />
            )}
          </p>
        </div>
        {financing ? (
          <>
            <div
              className="hidden h-5 w-px shrink-0 bg-ink/10 sm:block"
              aria-hidden="true"
            />
            <div className="min-w-0 shrink">{financing}</div>
          </>
        ) : null}
      </div>
    </div>
  );
}
