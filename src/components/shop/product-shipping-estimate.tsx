"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDictionary, useLocale } from "@/context/locale-context";
import { localizedHref } from "@/i18n/paths";
import { formatCheckoutPrice } from "@/lib/shop/category";
import { countryLabel, sortCountryCodes } from "@/lib/shop/countries";
import { localizeShippingRateLabel } from "@/lib/shop/localize-shipping-label";
import type { ProductShippingEstimate } from "@/lib/shop/estimate-product-shipping";
import { cn } from "@/lib/utils";

type ProductShippingEstimateProps = {
  productId?: number;
  variationId?: number;
  defaultCountry: string;
  className?: string;
};

function resolveInitialVariationId(
  variationId: number | undefined,
): number | undefined {
  return variationId && variationId > 0 ? variationId : undefined;
}

export function ProductShippingEstimate({
  productId,
  variationId,
  defaultCountry,
  className,
}: ProductShippingEstimateProps) {
  const locale = useLocale();
  const dict = useDictionary();
  const [country, setCountry] = useState(defaultCountry.toUpperCase());
  const [estimate, setEstimate] = useState<ProductShippingEstimate | null>(
    null,
  );
  const [loading, setLoading] = useState(Boolean(productId));
  const [failed, setFailed] = useState(false);
  const userSelectedCountry = useRef(false);

  const activeVariationId = useMemo(
    () => resolveInitialVariationId(variationId),
    [variationId],
  );

  useEffect(() => {
    setCountry(defaultCountry.toUpperCase());
  }, [defaultCountry]);

  // Pages are static (ISR), so visitor country comes from the edge via API.
  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/geo", { signal: controller.signal })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((payload: { country?: string } | null) => {
        const detected = payload?.country?.toUpperCase();
        if (detected && !userSelectedCountry.current) {
          setCountry(detected);
        }
      })
      .catch(() => {
        // Keep the default country when geo lookup fails.
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      setFailed(true);
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
  }, [activeVariationId, country, productId]);

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

  const methodLabel = estimate
    ? localizeShippingRateLabel(
        {
          id: estimate.methodId,
          methodId: estimate.methodId,
          label: estimate.label,
        },
        locale,
      )
    : null;

  let priceLine: string | null = null;

  if (estimate?.kind === "priced" && estimate.cost !== null) {
    priceLine = dict.pdp.shippingFrom.replace(
      "{price}",
      formatCheckoutPrice(estimate.cost, locale),
    );
  } else if (estimate?.kind === "free") {
    priceLine = dict.pdp.shippingFree;
  } else if (estimate?.kind === "byAgreement") {
    priceLine = dict.pdp.shippingByAgreement;
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/70">
        {loading && !estimate ? (
          <span className="text-ink/45">{dict.pdp.shippingLoading}</span>
        ) : priceLine ? (
          <span className="font-medium text-ink">{priceLine}</span>
        ) : failed ? (
          <span>{dict.pdp.shippingFallback}</span>
        ) : null}

        <label className="inline-flex items-center gap-1.5 text-ink/55">
          <span className="sr-only">{dict.pdp.shippingCountry}</span>
          <select
            value={countries.includes(country) ? country : countries[0]}
            onChange={(event) => {
              userSelectedCountry.current = true;
              setCountry(event.target.value.toUpperCase());
            }}
            className="max-w-[11rem] border-0 bg-transparent py-0.5 pr-6 text-sm text-ink/70 underline decoration-ink/25 underline-offset-4 outline-none hover:text-ink"
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

      {methodLabel && estimate?.kind !== "byAgreement" ? (
        <p className="text-xs text-ink/45">
          {dict.pdp.shippingVia.replace("{method}", methodLabel)}
        </p>
      ) : null}

      <p className="text-xs text-ink/45">
        {dict.pdp.shippingEstimateDisclaimer}{" "}
        <Link
          href={localizedHref(locale, "/shipping")}
          className="underline underline-offset-2 hover:text-ink"
        >
          {dict.pdp.shippingInfoLink}
        </Link>
      </p>
    </div>
  );
}
