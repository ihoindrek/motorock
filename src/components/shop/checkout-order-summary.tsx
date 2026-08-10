"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useDictionary, useLocale } from "@/context/locale-context";
import { CheckoutTrustBadges } from "@/components/shop/checkout-mobile-trust";
import { countryLabel } from "@/hooks/use-checkout-shipping";
import { localizedHref } from "@/i18n/paths";
import type { ShippingRate } from "@/lib/shop/shipping-method";
import { isShippingByAgreement } from "@/lib/shop/shipping-method";
import { localizeShippingRateLabel } from "@/lib/shop/localize-shipping-label";
import { formatCheckoutPrice } from "@/lib/shop/category";
import { cn } from "@/lib/utils";
import { SHOWROOM } from "@/data/showroom";

type CheckoutOrderSummaryProps = {
  itemCount: number;
  subtotal: number;
  discountTotal?: number;
  shippingTotal: number;
  total: number;
  selectedRate: ShippingRate | null;
  country: string;
  pickupPointName?: string | null;
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  canSubmit: boolean;
  submitting: boolean;
  loading: boolean;
  formId: string;
  payLabel?: string;
  submitBlockReason?: string | null;
  className?: string;
  variant?: "sidebar" | "mobile";
};

function TrustCopy() {
  const locale = useLocale();
  const t =
    locale === "et"
      ? { questions: "Küsimusi?" }
      : { questions: "Questions?" };

  return (
    <ul className="space-y-1.5 text-xs leading-relaxed text-ink/55">
      <li>
        {t.questions}{" "}
        <a href={SHOWROOM.emailHref} className="text-ink hover:text-accent">
          {SHOWROOM.email}
        </a>
      </li>
    </ul>
  );
}

export function CheckoutOrderSummary({
  itemCount,
  subtotal,
  discountTotal = 0,
  shippingTotal,
  total,
  selectedRate,
  country,
  pickupPointName,
  termsAccepted,
  onTermsChange,
  canSubmit,
  submitting,
  loading,
  formId,
  payLabel,
  submitBlockReason,
  className,
  variant = "sidebar",
}: CheckoutOrderSummaryProps) {
  const locale = useLocale();
  const dict = useDictionary();
  const isMobile = variant === "mobile";
  const t =
    locale === "et"
      ? {
          orderSummary: "Tellimuse kokkuvõte",
          items: "Tooted",
          shipping: "Tarne",
          free: "Tasuta",
          byAgreement: "Kokkuleppel",
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
          byAgreement: "By agreement",
          chooseDelivery: "Choose a delivery option",
          total: "Total",
          agreeTerms: "I agree to the",
          terms: "terms & conditions",
          processing: "Processing…",
          pay: "Pay",
        };

  const shippingLabel =
    selectedRate && isShippingByAgreement(selectedRate)
      ? t.byAgreement
      : shippingTotal === 0
        ? t.free
        : formatCheckoutPrice(shippingTotal, locale);

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
          <dd className="font-body font-extrabold tabular-nums">{formatCheckoutPrice(subtotal, locale)}</dd>
        </div>
        {discountTotal > 0 ? (
          <div className="flex justify-between gap-4">
            <dt className="text-ink/70">{dict.checkout.discount}</dt>
            <dd className="font-body font-extrabold tabular-nums text-accent">
              −{formatCheckoutPrice(discountTotal, locale)}
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-ink/70">{t.shipping}</dt>
          <dd className="font-body font-extrabold tabular-nums">
            {shippingLabel}
          </dd>
        </div>
        {selectedRate ? (
          <p className="text-xs text-ink/50">
            {localizeShippingRateLabel(selectedRate, locale)} ·{" "}
            {countryLabel(country)}
            {pickupPointName ? <> · {pickupPointName}</> : null}
          </p>
        ) : (
          <p className="text-xs text-ink/50">{t.chooseDelivery}</p>
        )}
        <div className="flex justify-between gap-4 border-t border-ink/10 pt-3 text-lg">
          <dt className="font-bold">{t.total}</dt>
          <dd>
            <span className="font-body text-lg font-extrabold tabular-nums tracking-normal text-accent">
              {formatCheckoutPrice(total, locale)}
            </span>
          </dd>
        </div>
        {isMobile ? (
          <p className="text-[11px] text-ink/45">{dict.checkout.pricesIncludeVat}</p>
        ) : null}
      </dl>

      {isMobile ? (
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
                target="_blank"
                rel="noopener noreferrer"
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
            className="btn-accent mt-4 min-h-14 w-full justify-center py-4 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting
              ? t.processing
              : `${payLabel ?? t.pay} · ${formatCheckoutPrice(total, locale)}`}
          </button>

          {!canSubmit && submitBlockReason ? (
            <p className="mt-2 text-xs text-ink/55" role="status">
              {submitBlockReason}
            </p>
          ) : null}

          <div className="mt-5 border-t border-ink/10 pt-4">
            <CheckoutTrustBadges />
          </div>
        </>
      ) : null}

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
                target="_blank"
                rel="noopener noreferrer"
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
            {submitting
              ? t.processing
              : `${payLabel ?? t.pay} · ${formatCheckoutPrice(total, locale)}`}
          </button>

          {!canSubmit && submitBlockReason ? (
            <p className="mt-2 text-xs text-ink/55" role="status">
              {submitBlockReason}
            </p>
          ) : null}

          <div className="mt-5 border-t border-ink/10 pt-4">
            <TrustCopy />
            <CheckoutTrustBadges className="mt-4 hidden lg:block" />
          </div>
        </>
      ) : null}
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
