"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { countryLabel } from "@/hooks/use-checkout-shipping";
import type { ShippingRate } from "@/lib/shop/shipping-method";
import { formatPrice } from "@/lib/shop/category";
import { cn } from "@/lib/utils";
import { EQUIPMENT_RETURN_PROMISE } from "@/data/return-policy";

type CheckoutOrderSummaryProps = {
  itemCount: number;
  subtotal: number;
  shippingTotal: number;
  total: number;
  selectedRate: ShippingRate | null;
  country: string;
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  canSubmit: boolean;
  submitting: boolean;
  loading: boolean;
  formId: string;
  className?: string;
  variant?: "sidebar" | "mobile";
};

function TrustCopy() {
  return (
    <ul className="space-y-1.5 text-xs leading-relaxed text-ink/55">
      <li>Secure payment via Montonio — bank, card, pay later & järelmaks</li>
      <li className="text-xs text-ink/60">
        {EQUIPMENT_RETURN_PROMISE.headline}
      </li>
      <li>
        Questions?{" "}
        <a href="mailto:hello@motorock.eu" className="text-ink hover:text-accent">
          hello@motorock.eu
        </a>
      </li>
    </ul>
  );
}

export function CheckoutOrderSummary({
  itemCount,
  subtotal,
  shippingTotal,
  total,
  selectedRate,
  country,
  termsAccepted,
  onTermsChange,
  canSubmit,
  submitting,
  loading,
  formId,
  className,
  variant = "sidebar",
}: CheckoutOrderSummaryProps) {
  const isMobile = variant === "mobile";

  return (
    <div
      className={cn(
        "bg-white",
        isMobile ? "px-4 py-3" : "p-5 shadow-[0_12px_40px_rgb(11_11_11_/_0.07)] sm:p-6",
        className,
      )}
    >
      {!isMobile ? (
        <h2 className="font-display text-sm font-extrabold uppercase tracking-aggressive text-ink">
          Order summary
        </h2>
      ) : null}

      <dl className={cn("space-y-2 text-sm", !isMobile && "mt-4")}>
        <div className="flex justify-between gap-4">
          <dt className="text-ink/70">Items ({itemCount})</dt>
          <dd className="font-bold tabular-nums">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink/70">Shipping</dt>
          <dd className="font-bold tabular-nums">
            {shippingTotal === 0 ? "Free" : formatPrice(shippingTotal)}
          </dd>
        </div>
        {selectedRate ? (
          <p className="text-xs text-ink/50">
            {selectedRate.label} · {countryLabel(country)}
          </p>
        ) : (
          <p className="text-xs text-ink/50">Choose a delivery option</p>
        )}
        <div className="flex justify-between gap-4 border-t border-ink/10 pt-3 text-lg">
          <dt className="font-bold">Total</dt>
          <dd className="font-display font-extrabold tabular-nums text-accent">
            {formatPrice(total)}
          </dd>
        </div>
      </dl>

      {!isMobile ? (
        <>
          <label className="mt-5 flex items-start gap-3 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => onTermsChange(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-accent"
              required
              form={formId}
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="text-ink hover:text-accent">
                terms & conditions
              </Link>
            </span>
          </label>

          <button
            type="submit"
            form={formId}
            disabled={submitting || !canSubmit || loading}
            className="btn-accent mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Processing…" : `Pay · ${formatPrice(total)}`}
          </button>

          <div className="mt-5 border-t border-ink/10 pt-4">
            <TrustCopy />
          </div>
        </>
      ) : null}
    </div>
  );
}

export function CheckoutMobilePayBar({
  total,
  canSubmit,
  submitting,
  loading,
  formId,
}: {
  total: number;
  canSubmit: boolean;
  submitting: boolean;
  loading: boolean;
  formId: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 px-5 py-3 backdrop-blur-sm lg:hidden">
      <div className="mx-auto flex max-w-site items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
            Total
          </p>
          <p className="font-display text-xl font-extrabold tabular-nums text-accent">
            {formatPrice(total)}
          </p>
        </div>
        <button
          type="submit"
          form={formId}
          disabled={submitting || !canSubmit || loading}
          className="btn-accent shrink-0 justify-center px-6 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "…" : "Pay"}
        </button>
      </div>
    </div>
  );
}

export function CheckoutSummaryShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside className={cn("lg:sticky lg:top-24 lg:self-start", className)}>
      {children}
    </aside>
  );
}
