"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FreeShippingNote } from "@/components/shop/free-shipping-note";
import { ProductShippingCarrierIcons } from "@/components/shop/product-shipping-carrier-icons";
import { useDictionary, useLocale } from "@/context/locale-context";
import { localizedHref } from "@/i18n/paths";
import { countryLabel, sortCountryCodes } from "@/lib/shop/countries";
import type { ProductShippingEstimate } from "@/lib/shop/estimate-product-shipping";
import { isShippingByAgreement } from "@/lib/shop/shipping-method";
import { isShowroomPickupRate } from "@/lib/shop/shipping-showroom-pickup";
import { MorphingSquare } from "@/components/ui/morphing-square";
import { cn } from "@/lib/utils";

type ProductShippingReturnsPanelProps = {
  productId?: number;
  variationId?: number;
  size?: string;
  defaultCountry: string;
  /** When false, skip Woo fetch until accordion opens. */
  active: boolean;
  className?: string;
};

function firstVariationId(variationId: number | undefined) {
  return variationId && variationId > 0 ? variationId : undefined;
}

function toShippingRate(
  rate: ProductShippingEstimate["rates"][number],
) {
  return {
    id: rate.id,
    label: rate.label,
    methodId: rate.methodId,
    cost: rate.cost !== null ? String(rate.cost) : null,
    instanceId: null,
  };
}

function carrierIconRates(estimate: ProductShippingEstimate) {
  return estimate.rates.filter((rate) => {
    if (rate.kind === "byAgreement") {
      return false;
    }

    const shippingRate = toShippingRate(rate);
    return (
      !isShippingByAgreement(shippingRate) &&
      !isShowroomPickupRate(shippingRate)
    );
  });
}

export function ProductShippingReturnsPanel({
  productId,
  variationId,
  size,
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

    if (size) {
      params.set("size", size);
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
  }, [active, activeVariationId, country, productId, size]);

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

  const iconRates = estimate ? carrierIconRates(estimate) : [];

  return (
    <div className={cn("space-y-6", className)}>
      <div className="relative space-y-3">
        {loading && estimate ? (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-paper/70 backdrop-blur-[2px]"
            aria-live="polite"
            aria-busy="true"
          >
            <MorphingSquare message={dict.pdp.shippingLoading} size="sm" />
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
                onChange={(event) =>
                  setCountry(event.target.value.toUpperCase())
                }
                className="border border-ink/15 bg-white px-2 py-1.5 text-sm text-ink outline-none hover:border-ink/30"
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
            <div className="flex min-h-16 flex-col items-center justify-center py-4">
              <MorphingSquare message={dict.pdp.shippingLoading} size="sm" />
            </div>
          ) : failed || !estimate || iconRates.length === 0 ? (
            <p className="text-sm leading-relaxed text-ink/65">
              {dict.pdp.shippingFallback}
            </p>
          ) : (
            <ProductShippingCarrierIcons rates={iconRates} />
          )}

          <FreeShippingNote />

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
