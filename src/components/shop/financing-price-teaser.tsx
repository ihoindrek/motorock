"use client";

import { useDictionary } from "@/context/locale-context";
import { FINANCING_COUNTRY_CODE, isFinancingAvailable } from "@/data/financing";
import {
  getInbankCalculatorConfig,
  isInbankCalculatorAmount,
} from "@/lib/montonio/inbank-calculator";
import { Price } from "@/components/shop/price";
import { MontonioFinancingCalculator } from "@/components/shop/montonio-financing-calculator";
import type { ComponentProps } from "react";

type FinancingPriceTeaserProps = {
  price: number;
  variant?: "hero" | "compact";
  priceVariant?: ComponentProps<typeof Price>["variant"];
  className?: string;
  countryCode?: string;
};

export function FinancingPriceTeaser({
  price,
  variant = "hero",
  priceVariant,
  className,
  countryCode = FINANCING_COUNTRY_CODE,
}: FinancingPriceTeaserProps) {
  const dict = useDictionary();
  const config = getInbankCalculatorConfig();
  const resolvedPriceVariant = priceVariant ?? (variant === "hero" ? "xl" : "md");
  const showCalculator =
    config.enabled &&
    isFinancingAvailable(countryCode) &&
    isInbankCalculatorAmount(price) &&
    price > 0;

  const financing = showCalculator ? (
    <MontonioFinancingCalculator
      amount={price}
      countryCode={countryCode}
      eyebrow={dict.financing.finance}
      calculateLabel={dict.financing.calculateFinancing}
    />
  ) : null;

  if (variant === "compact") {
    return (
      <div className={className}>
        <Price value={price} variant={resolvedPriceVariant} />
        {financing ? <div className="mt-2">{financing}</div> : null}
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
            <Price value={price} variant={resolvedPriceVariant} />
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
