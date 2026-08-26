"use client";

import { Lock, RotateCcw, Truck } from "lucide-react";
import { useDictionary, useLocale } from "@/context/locale-context";
import { formatCheckoutPrice, formatPrice } from "@/lib/shop/category";
import { isShippingByAgreement } from "@/lib/shop/shipping-method";
import type { ShippingRate } from "@/lib/shop/shipping-method";
import { cn } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD_EUR } from "@/data/storefront-policies";

function formatShippingLabel(
  shippingTotal: number,
  selectedRate: ShippingRate | null,
  locale: "en" | "et",
  pendingLabel: string,
  freeLabel: string,
  byAgreementLabel: string,
) {
  if (!selectedRate) {
    return pendingLabel;
  }

  if (isShippingByAgreement(selectedRate)) {
    return byAgreementLabel;
  }

  if (shippingTotal === 0) {
    return freeLabel;
  }

  return formatCheckoutPrice(shippingTotal, locale);
}

export function CheckoutMobileDeliveryTotals({
  shippingTotal,
  total,
  selectedRate,
  shippingLoading,
  className,
}: {
  shippingTotal: number;
  total: number;
  selectedRate: ShippingRate | null;
  shippingLoading: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const dict = useDictionary();

  const t =
    locale === "et"
      ? {
          shipping: "Tarne",
          total: "Kokku",
          free: "Tasuta",
          byAgreement: "Kokkuleppel",
        }
      : {
          shipping: "Shipping",
          total: "Total",
          free: "Free",
          byAgreement: "By agreement",
        };

  if (!selectedRate) {
    return null;
  }

  const shippingLabel = formatShippingLabel(
    shippingTotal,
    selectedRate,
    locale,
    "",
    t.free,
    t.byAgreement,
  );

  return (
    <div
      className={cn(
        "rounded-sm border border-ink/10 bg-surface/40 px-3 py-3 lg:hidden",
        className,
      )}
    >
      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-ink/65">{t.shipping}</dt>
          <dd className="font-body font-bold tabular-nums text-ink">
            {shippingLoading ? "…" : shippingLabel}
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-ink/10 pt-2">
          <dt className="font-bold text-ink">{t.total}</dt>
          <dd className="font-body font-extrabold tabular-nums text-accent">
            {formatCheckoutPrice(total, locale)}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-[11px] text-ink/45">{dict.checkout.pricesIncludeVat}</p>
    </div>
  );
}

export function CheckoutTrustBadges({ className }: { className?: string }) {
  const locale = useLocale();
  const dict = useDictionary();

  const t =
    locale === "et"
      ? { securePayment: "Turvaline makse" }
      : { securePayment: "Secure payment" };

  return (
    <ul className={cn("space-y-1 text-[11px] leading-snug text-ink/55", className)}>
      <li className="flex items-center gap-2">
        <Truck className="size-3.5 shrink-0 text-ink/40" aria-hidden="true" />
        {dict.pdp.shippingFreeFromThreshold.replace(
          "{amount}",
          formatPrice(FREE_SHIPPING_THRESHOLD_EUR, locale),
        )}
      </li>
      <li className="flex items-center gap-2">
        <Lock className="size-3.5 shrink-0 text-ink/40" aria-hidden="true" />
        {t.securePayment}
      </li>
      <li className="flex items-center gap-2">
        <RotateCcw className="size-3.5 shrink-0 text-ink/40" aria-hidden="true" />
        {dict.checkout.trustFreeReturns}
      </li>
    </ul>
  );
}
