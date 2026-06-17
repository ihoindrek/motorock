"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale } from "@/context/locale-context";
import { countryLabel } from "@/hooks/use-checkout-shipping";
import { localizedHref } from "@/i18n/paths";
import type { ShippingRate } from "@/lib/shop/shipping-method";
import { formatPrice } from "@/lib/shop/category";
import { Price } from "@/components/shop/price";
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
  const locale = useLocale();
  const t =
    locale === "et"
      ? {
          securePayment:
            "Turvaline makse Montonioga — pank, kaart, maksa hiljem ja järelmaks",
          questions: "Küsimusi?",
        }
      : {
          securePayment:
            "Secure payment via Montonio — bank, card, pay later & järelmaks",
          questions: "Questions?",
        };

  return (
    <ul className="space-y-1.5 text-xs leading-relaxed text-ink/55">
      <li>{t.securePayment}</li>
      <li className="text-xs text-ink/60">
        {EQUIPMENT_RETURN_PROMISE.headline}
      </li>
      <li>
        {t.questions}{" "}
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
  const locale = useLocale();
  const isMobile = variant === "mobile";
  const t =
    locale === "et"
      ? {
          orderSummary: "Tellimuse kokkuvõte",
          items: "Tooted",
          shipping: "Tarne",
          free: "Tasuta",
          chooseDelivery: "Vali tarneviis",
          total: "Kokku",
          agreeTerms: "Nõustun",
          terms: "tingimustega",
          processing: "Töötlen…",
          pay: "Maksa",
        }
      : {
          orderSummary: "Order summary",
          items: "Items",
          shipping: "Shipping",
          free: "Free",
          chooseDelivery: "Choose a delivery option",
          total: "Total",
          agreeTerms: "I agree to the",
          terms: "terms & conditions",
          processing: "Processing…",
          pay: "Pay",
        };

  return (
    <div
      className={cn(
        "bg-white",
        isMobile ? "px-4 py-3" : "p-5 shadow-[0_12px_40px_rgb(11_11_11_/_0.07)] sm:p-6",
        className,
      )}
    >
      {!isMobile ? (
        <h2 className="font-body text-sm font-extrabold uppercase tracking-aggressive text-ink">
          {t.orderSummary}
        </h2>
      ) : null}

      <dl className={cn("space-y-2 text-sm", !isMobile && "mt-4")}>
        <div className="flex justify-between gap-4">
          <dt className="text-ink/70">{t.items} ({itemCount})</dt>
          <dd className="font-body font-extrabold tabular-nums">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink/70">{t.shipping}</dt>
          <dd className="font-body font-extrabold tabular-nums">
            {shippingTotal === 0 ? t.free : formatPrice(shippingTotal)}
          </dd>
        </div>
        {selectedRate ? (
          <p className="text-xs text-ink/50">
            {selectedRate.label} · {countryLabel(country)}
          </p>
        ) : (
          <p className="text-xs text-ink/50">{t.chooseDelivery}</p>
        )}
        <div className="flex justify-between gap-4 border-t border-ink/10 pt-3 text-lg">
          <dt className="font-bold">{t.total}</dt>
          <dd>
            <Price value={total} variant="lg" className="text-accent" />
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
              {t.agreeTerms}{" "}
              <Link
                href={localizedHref(locale, "/terms")}
                className="text-ink hover:text-accent"
              >
                {t.terms}
              </Link>
            </span>
          </label>

          <button
            type="submit"
            form={formId}
            disabled={submitting || !canSubmit || loading}
            className="btn-accent mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? t.processing : `${t.pay} · ${formatPrice(total)}`}
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
  const locale = useLocale();
  const t =
    locale === "et"
      ? { total: "Kokku", pay: "Maksa" }
      : { total: "Total", pay: "Pay" };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 px-5 py-3 backdrop-blur-sm lg:hidden">
      <div className="mx-auto flex max-w-site items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
            {t.total}
          </p>
          <Price value={total} variant="lg" className="text-accent" as="p" />
        </div>
        <button
          type="submit"
          form={formId}
          disabled={submitting || !canSubmit || loading}
          className="btn-accent shrink-0 justify-center px-6 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "…" : t.pay}
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
