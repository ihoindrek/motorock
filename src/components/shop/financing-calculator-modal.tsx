"use client";

import { useMemo, useState } from "react";
import { ShopModal } from "@/components/ui/shop-modal";
import { FINANCING_DISCLAIMER } from "@/data/financing";
import type { FinancingProductType } from "@/data/financing";
import { formatPrice } from "@/lib/shop/category";
import {
  formatInterestRate,
  formatMonthlyPrice,
  getEligibleProviders,
  getFinancingQuote,
  getDefaultFinancingSelection,
} from "@/lib/shop/financing";
import { cn } from "@/lib/utils";

type FinancingCalculatorModalProps = {
  open: boolean;
  onClose: () => void;
  price: number;
  productType: FinancingProductType;
  productName?: string;
  onCheckout?: () => void;
  onEnquire?: () => void;
};

export function FinancingCalculatorModal({
  open,
  onClose,
  price,
  productType,
  productName,
  onCheckout,
  onEnquire,
}: FinancingCalculatorModalProps) {
  const providers = useMemo(
    () => getEligibleProviders(price, productType),
    [price, productType],
  );

  const defaultSelection = useMemo(
    () => getDefaultFinancingSelection(price, productType),
    [price, productType],
  );

  const [providerId, setProviderId] = useState(
    () => defaultSelection?.providerId ?? "montonio",
  );
  const [termMonths, setTermMonths] = useState(
    () => defaultSelection?.termMonths ?? 12,
  );

  const activeProvider =
    providers.find((provider) => provider.id === providerId) ?? providers[0];

  const quote = activeProvider
    ? getFinancingQuote(price, activeProvider, termMonths)
    : null;

  if (!providers.length) {
    return (
      <ShopModal
        open={open}
        onClose={onClose}
        eyebrow="Financing"
        title="Not available online"
        description="This item may still qualify in-store — get in touch and we'll walk you through options."
      >
        {onEnquire ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              onEnquire();
            }}
            className="inline-flex items-center rounded-full bg-ink px-7 py-3 font-display text-xs font-bold uppercase tracking-aggressive text-paper transition-colors duration-200 hover:bg-accent"
          >
            Ask about financing →
          </button>
        ) : null}
      </ShopModal>
    );
  }

  const availableTerms = activeProvider?.terms ?? [];

  return (
    <ShopModal
      open={open}
      onClose={onClose}
      eyebrow="Financing"
      title="Monthly payment"
      description={
        productName
          ? `${productName} · ${formatPrice(price)}`
          : formatPrice(price)
      }
      size="lg"
    >
      <div className="space-y-8">
        {providers.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {providers.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => {
                  setProviderId(provider.id);
                  if (!provider.terms.includes(termMonths)) {
                    setTermMonths(provider.defaultTerm);
                  }
                }}
                className={cn(
                  "border px-3 py-2 font-display text-[10px] font-bold uppercase tracking-aggressive transition-colors",
                  provider.id === activeProvider?.id
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/15 text-ink/60 hover:border-ink/30 hover:text-ink",
                )}
              >
                {provider.name}
              </button>
            ))}
          </div>
        ) : activeProvider ? (
          <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-ink">
            {activeProvider.name}
          </p>
        ) : null}

        {activeProvider && providers.length > 1 ? (
          <p className="text-sm text-ink/55">{activeProvider.tagline}</p>
        ) : null}

        <div>
          <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/40">
            Term
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {availableTerms.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setTermMonths(term)}
                className={cn(
                  "min-w-[3.5rem] border px-3 py-2 text-xs font-medium transition-colors",
                  term === termMonths
                    ? "border-accent bg-accent/10 text-ink"
                    : "border-ink/15 text-ink/60 hover:border-ink/30 hover:text-ink",
                )}
              >
                {term} mo
              </button>
            ))}
          </div>
        </div>

        {quote ? (
          <div className="border border-ink/10 bg-moto/50 p-5 sm:p-6">
            <p className="font-display text-[10px] font-bold uppercase tracking-aggressive text-ink/40">
              Estimated monthly
            </p>
            <p className="mt-2 font-display text-4xl font-extrabold tracking-tight text-accent sm:text-5xl">
              {formatMonthlyPrice(quote.monthlyPayment)}
              <span className="ml-1 text-lg font-bold text-ink/45">/mo</span>
            </p>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-ink/45">Purchase price</dt>
                <dd className="font-medium text-ink">{formatPrice(price)}</dd>
              </div>
              <div>
                <dt className="text-ink/45">Indicative interest</dt>
                <dd className="font-medium text-ink">
                  {quote.annualInterestRate <= 0
                    ? "0% (promo)"
                    : formatInterestRate(quote.annualInterestRate)}
                </dd>
              </div>
              <div>
                <dt className="text-ink/45">Total payable</dt>
                <dd className="font-medium text-ink">
                  {formatPrice(Math.ceil(quote.totalPayable))}
                </dd>
              </div>
              <div>
                <dt className="text-ink/45">Interest & fees</dt>
                <dd className="font-medium text-ink">
                  {quote.interestAmount <= 0
                    ? "—"
                    : formatPrice(Math.ceil(quote.interestAmount))}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        {activeProvider?.availableAtCheckout ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-ink/60">
              Choose <strong className="font-medium text-ink">Montonio</strong> at
              checkout for pay later and järelmaks — same flow as on motorock.eu.
            </p>
            {onCheckout ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCheckout();
                }}
                className="inline-flex items-center rounded-full bg-ink px-7 py-3 font-display text-xs font-bold uppercase tracking-aggressive text-paper transition-colors duration-200 hover:bg-accent"
              >
                {productType === "equipment"
                  ? "Continue to checkout →"
                  : "Discuss at checkout →"}
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-ink/60">
            {activeProvider?.name} applications are handled with our team — we can
            prepare an offer when you order or visit the showroom.
          </p>
        )}

        {productType === "motorcycle" && onEnquire ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              onEnquire();
            }}
            className="inline-flex items-center font-display text-xs font-bold uppercase tracking-aggressive text-ink/55 transition-colors hover:text-accent"
          >
            Ask about {activeProvider?.name ?? "financing"} →
          </button>
        ) : null}

        <p className="text-[11px] leading-relaxed text-ink/40">{FINANCING_DISCLAIMER}</p>
      </div>
    </ShopModal>
  );
}
