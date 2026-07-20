"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ShippingMethodIcon } from "@/components/shop/shipping-method-icon";
import { useDictionary, useLocale } from "@/context/locale-context";
import { localizedHref } from "@/i18n/paths";
import { formatCheckoutPrice } from "@/lib/shop/category";
import { countryLabel, sortCountryCodes } from "@/lib/shop/countries";
import type { ProductShippingEstimate } from "@/lib/shop/estimate-product-shipping";
import { localizeShippingRateLabel } from "@/lib/shop/localize-shipping-label";
import { MorphLoading } from "@/components/ui/morph-loading";
import { cn } from "@/lib/utils";

type ProductShippingReturnsPanelProps = {
  productId?: number;
  variationId?: number;
  defaultCountry: string;
  /** When false, skip Woo fetch until accordion opens. */
  active: boolean;
  className?: string;
};

function firstVariationId(variationId: number | undefined) {
  return variationId && variationId > 0 ? variationId : undefined;
}

export function ProductShippingReturnsPanel({
  productId,
  variationId,
  defaultCountry,
  active,
  className,
}: ProductShippingReturnsPanelProps) {
  const locale = useLocale();
  const dict = useDictionary();
  const [country, setCountry] = useState(defaultCountry.toUpperCase());
  const [estimate, setEstimate] = useState<ProductShippingEstimate | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const activeVariationId = useMemo(
    () => firstVariationId(variationId),
    [variationId],
  );

  useEffect(() => {
    setCountry(defaultCountry.toUpperCase());
  }, [defaultCountry]);

  useEffect(() => {
    if (!active || !productId) {
      if (active && !productId) {
        setFailed(true);
      }
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setFailed(false);

    const params = new URLSearchParams({
      country,
      productId: String(productId),
    });

    if (activeVariationId) {
      params.set("variationId", String(activeVariationId));
    }

    void fetch(`/api/shipping/estimate?${params}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("estimate failed");
        }

        return (await response.json()) as ProductShippingEstimate;
      })
      .then((payload) => {
        setEstimate(payload);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setEstimate(null);
        setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [active, activeVariationId, country, productId]);

  useEffect(() => {
    if (!estimate?.countries.length) {
      return;
    }

    if (!estimate.countries.includes(country)) {
      const fallback = estimate.countries.includes("EE")
        ? "EE"
        : estimate.countries[0];
      if (fallback) {
        setCountry(fallback);
      }
    }
  }, [country, estimate]);

  const countries = useMemo(() => {
    const list = estimate?.countries?.length
      ? estimate.countries
      : [country, "EE", "LV", "LT", "FI"];
    return sortCountryCodes(list, country);
  }, [country, estimate?.countries]);

  const priceLabels = {
    free: dict.pdp.shippingFree,
    byAgreement: dict.pdp.shippingByAgreement,
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="relative space-y-3">
        {loading && estimate ? (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-paper/70 backdrop-blur-[2px]"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex flex-col items-center gap-3 rounded-sm border border-ink/10 bg-white px-8 py-6 shadow-[0_8px_32px_rgb(11_11_11/0.08)]">
              <MorphLoading size="sm" />
              <p className="text-xs font-medium text-ink/55">{dict.pdp.shippingLoading}</p>
            </div>
          </div>
        ) : null}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-body text-[11px] font-bold uppercase tracking-aggressive text-ink">
            {dict.pdp.shippingMethodsHeading}
          </p>
          <label className="inline-flex items-center gap-2 text-sm text-ink/60">
            <span className="sr-only">{dict.pdp.shippingCountry}</span>
            <select
              value={countries.includes(country) ? country : countries[0]}
              onChange={(event) => setCountry(event.target.value.toUpperCase())}
              className="border border-ink/15 bg-paper px-2 py-1.5 text-sm text-ink outline-none hover:border-ink/30"
              aria-label={dict.pdp.shippingCountry}
            >
              {countries.map((code) => (
                <option key={code} value={code}>
                  {countryLabel(code)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && !estimate ? (
          <div className="flex min-h-28 flex-col items-center justify-center gap-3">
            <MorphLoading size="sm" />
            <p className="text-xs font-medium text-ink/55">{dict.pdp.shippingLoading}</p>
          </div>
        ) : failed || !estimate || estimate.rates.length === 0 ? (
          <p className="text-sm leading-relaxed text-ink/65">
            {dict.pdp.shippingFallback}
          </p>
        ) : (
          <ul>
            {estimate.rates.map((rate) => {
              const label = localizeShippingRateLabel(
                {
                  id: rate.id,
                  methodId: rate.methodId,
                  label: rate.label,
                },
                locale,
              );
              const price =
                rate.kind === "byAgreement"
                  ? priceLabels.byAgreement
                  : rate.kind === "free" || rate.cost === 0
                    ? priceLabels.free
                    : formatCheckoutPrice(rate.cost ?? 0, locale);

              return (
                <li
                  key={rate.id}
                  className="flex items-center gap-2.5 border-b border-ink/10 py-2 last:border-b-0"
                >
                  <ShippingMethodIcon
                    className="!size-8 !border-0 !bg-transparent !p-0"
                    rate={{
                      id: rate.id,
                      label: rate.label,
                      methodId: rate.methodId,
                      cost:
                        rate.cost !== null ? String(rate.cost) : null,
                      instanceId: null,
                    }}
                  />
                  <span className="min-w-0 flex-1 text-xs leading-snug text-ink/75">
                    {label}
                  </span>
                  <span className="shrink-0 font-body text-xs font-semibold tabular-nums text-ink">
                    {price}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-xs leading-relaxed text-ink/45">
          {dict.pdp.shippingEstimateDisclaimer}{" "}
          <Link
            href={localizedHref(locale, "/shipping")}
            className="underline underline-offset-2 hover:text-ink"
          >
            {dict.pdp.shippingInfoLink}
          </Link>
        </p>
      </div>
      </div>

      <div className="border-t border-ink/10 pt-5">
        <p className="font-body text-[11px] font-bold uppercase tracking-aggressive text-ink">
          {dict.returns.headline}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink/65">
          {dict.returns.detail}
        </p>
        <Link
          href={localizedHref(locale, "/returns")}
          className="mt-3 inline-block text-sm text-ink/55 underline underline-offset-2 hover:text-ink"
        >
          {dict.footer.returns}
        </Link>
      </div>
    </div>
  );
}
