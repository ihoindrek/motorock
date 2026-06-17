"use client";

import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { FinancingProductType } from "@/data/financing";
import { formatPrice } from "@/lib/shop/category";
import {
  formatMonthlyPrice,
  getLowestFinancingQuote,
} from "@/lib/shop/financing";
import { FinancingCalculatorModal } from "@/components/shop/financing-calculator-modal";

type FinancingPriceTeaserProps = {
  price: number;
  productType: FinancingProductType;
  productName?: string;
  variant?: "hero" | "compact";
  className?: string;
  onCheckout?: () => void;
  onEnquire?: () => void;
};

export function FinancingPriceTeaser({
  price,
  productType,
  productName,
  variant = "hero",
  className,
  onCheckout,
  onEnquire,
}: FinancingPriceTeaserProps) {
  const [open, setOpen] = useState(false);
  const lowestQuote = useMemo(
    () => getLowestFinancingQuote(price, productType),
    [price, productType],
  );

  if (!lowestQuote) {
    return null;
  }

  const isHero = variant === "hero";

  return (
    <>
      <div className={className}>
        {isHero ? (
          <div className="flex flex-wrap items-end gap-x-5 gap-y-4 sm:flex-nowrap sm:gap-x-6">
            <div className="shrink-0">
              <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
                Retail
              </p>
              <p className="mt-1 font-display text-2xl font-extrabold tabular-nums sm:text-3xl">
                {formatPrice(price)}
              </p>
            </div>
            <div
              className="mb-1 hidden h-8 w-px shrink-0 bg-ink/10 sm:block sm:h-9"
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="group min-w-0 shrink cursor-pointer text-left"
            >
              <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
                Finance
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-ink/65">
                <span className="font-bold text-ink transition-colors group-hover:text-accent">
                  {formatMonthlyPrice(lowestQuote.monthlyPayment)}/mo
                </span>
                <span>· indicative</span>
                <ChevronRight
                  className="size-4 shrink-0 text-ink/35 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-accent"
                  aria-hidden="true"
                />
              </p>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="group flex w-full cursor-pointer flex-wrap items-center gap-x-2 gap-y-1 text-left"
            >
              <span className="font-display text-base font-extrabold text-ink sm:text-lg">
                {formatPrice(price)}
              </span>
              <span className="text-ink/35">·</span>
              <span className="font-display text-sm font-bold text-accent transition-colors group-hover:text-ink">
                or from {formatMonthlyPrice(lowestQuote.monthlyPayment)}/mo
              </span>
              <ChevronRight
                className="size-4 shrink-0 text-accent/70 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-ink"
                aria-hidden="true"
              />
            </button>
          </div>
        )}
      </div>

      <FinancingCalculatorModal
        open={open}
        onClose={() => setOpen(false)}
        price={price}
        productType={productType}
        productName={productName}
        onCheckout={onCheckout}
        onEnquire={onEnquire}
      />
    </>
  );
}
