"use client";

import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { FinancingProductType } from "@/data/financing";
import { Price } from "@/components/shop/price";
import type { ComponentProps } from "react";
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
  priceVariant?: ComponentProps<typeof Price>["variant"];
  className?: string;
  onCheckout?: () => void;
  onEnquire?: () => void;
};

export function FinancingPriceTeaser({
  price,
  productType,
  productName,
  variant = "hero",
  priceVariant,
  className,
  onCheckout,
  onEnquire,
}: FinancingPriceTeaserProps) {
  const [open, setOpen] = useState(false);
  const lowestQuote = useMemo(
    () => getLowestFinancingQuote(price, productType),
    [price, productType],
  );

  const isHero = variant === "hero";
  const showFinancing = lowestQuote !== null && price > 0;
  const resolvedPriceVariant = priceVariant ?? (isHero ? "xl" : "md");

  return (
    <>
      <div className={className}>
        {isHero ? (
          <div className="flex flex-wrap items-end gap-x-5 gap-y-4 sm:flex-nowrap sm:gap-x-6">
            <div className="shrink-0">
              <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
                Retail
              </p>
              <p className="mt-1">
                <Price value={price} variant={resolvedPriceVariant} />
              </p>
            </div>
            {showFinancing ? (
              <>
                <div
                  className="mb-1 hidden h-8 w-px shrink-0 bg-ink/10 sm:block sm:h-9"
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="group min-w-0 shrink cursor-pointer text-left"
                >
                  <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
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
              </>
            ) : null}
          </div>
        ) : showFinancing ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="group flex w-full cursor-pointer flex-wrap items-center gap-x-2 gap-y-1 text-left"
            >
              <Price value={price} variant={resolvedPriceVariant} />
              <span className="text-ink/35">·</span>
              <span className="font-body text-sm font-bold text-accent transition-colors group-hover:text-ink">
                or from {formatMonthlyPrice(lowestQuote.monthlyPayment)}/mo
              </span>
              <ChevronRight
                className="size-4 shrink-0 text-accent/70 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-ink"
                aria-hidden="true"
              />
            </button>
          </div>
        ) : (
          <Price value={price} variant={resolvedPriceVariant} />
        )}
      </div>

      {showFinancing ? (
        <FinancingCalculatorModal
          open={open}
          onClose={() => setOpen(false)}
          price={price}
          productType={productType}
          productName={productName}
          onCheckout={onCheckout}
          onEnquire={onEnquire}
        />
      ) : null}
    </>
  );
}
