"use client";

import { useEffect, useMemo, useState } from "react";
import type { PickupPoint } from "@/types/pickup-point";
import type { ShippingRate } from "@/lib/shop/shipping-method";
import { MorphLoading } from "@/components/ui/morph-loading";
import { cn } from "@/lib/utils";

type CheckoutPickupPointSelectorProps = {
  shippingRate: ShippingRate;
  country: string;
  locale: "et" | "en";
  selectedPoint: PickupPoint | null;
  onSelect: (point: PickupPoint | null) => void;
};

function PickupPointsSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8" aria-hidden="true">
      <MorphLoading size="sm" />
      <div className="w-full space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-ink/10" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-ink/8" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CheckoutPickupPointSelector({
  shippingRate,
  country,
  locale,
  selectedPoint,
  onSelect,
}: CheckoutPickupPointSelectorProps) {
  const t =
    locale === "et"
      ? {
          label: "Pakiautomaat",
          choose: "Vali pakiautomaat",
          search: "Otsi linja või asukohta…",
          loading: "Laen pakiautomaate…",
          empty: "Ühtegi automaati ei leitud. Proovi teist otsingusõna.",
          error: "Pakiautomaate ei õnnestunud laadida.",
          change: "Muuda pakiautomaati",
        }
      : {
          label: "Parcel locker",
          choose: "Choose parcel locker",
          search: "Search city or location…",
          loading: "Loading parcel lockers…",
          empty: "No lockers found. Try another search.",
          error: "Could not load parcel lockers.",
          change: "Change parcel locker",
        };

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prefetching, setPrefetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<PickupPoint[]>([]);

  const rateKey = useMemo(
    () => `${shippingRate.id}:${shippingRate.methodId}:${country}`,
    [country, shippingRate.id, shippingRate.methodId],
  );

  useEffect(() => {
    onSelect(null);
    setQuery("");
    setIsOpen(false);
    setPoints([]);
    setError(null);
    setLoading(false);
    setPrefetching(true);
  }, [rateKey, onSelect]);

  useEffect(() => {
    let cancelled = false;

    async function loadPoints(searchQuery: string) {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          country,
          methodId: shippingRate.methodId,
          rateId: shippingRate.id,
          label: shippingRate.label,
          q: searchQuery,
        });
        const response = await fetch(`/api/shipping/pickup-points?${params}`);
        const payload = (await response.json()) as {
          points?: PickupPoint[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? t.error);
        }

        if (!cancelled) {
          setPoints(payload.points ?? []);
        }
      } catch (cause) {
        if (!cancelled) {
          setPoints([]);
          setError(cause instanceof Error ? cause.message : t.error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setPrefetching(false);
        }
      }
    }

    const timeout = window.setTimeout(
      () => {
        void loadPoints(query);
      },
      query ? 250 : 0,
    );

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [country, query, shippingRate, t.error]);

  const isLoading = prefetching || loading;
  const visiblePoints = useMemo(() => points, [points]);

  const handleChoosePoint = (point: PickupPoint) => {
    onSelect(point);
    setIsOpen(false);
    setQuery("");
  };

  const handleChange = () => {
    onSelect(null);
    setIsOpen(true);
    setQuery("");
  };

  return (
    <div className="mt-4 border-t border-ink/10 pt-5">
      <div className="flex items-center justify-between gap-3">
        <label className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/50">
          {t.label}
        </label>
        {isLoading && !selectedPoint ? (
          <span className="inline-flex items-center gap-2 text-[11px] text-ink/45">
            <MorphLoading size="sm" className="!size-8" />
            {t.loading}
          </span>
        ) : null}
      </div>

      {selectedPoint ? (
        <div className="mt-2 flex items-start justify-between gap-3 border border-accent bg-white px-4 py-3 shadow-sm">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{selectedPoint.name}</p>
            <p className="mt-1 text-xs text-ink/55">
              {selectedPoint.address}
              {selectedPoint.city ? `, ${selectedPoint.city}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={handleChange}
            className="shrink-0 text-xs font-medium text-ink/50 hover:text-accent"
          >
            {t.change}
          </button>
        </div>
      ) : isOpen ? (
        <>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search}
            autoFocus
            className="mt-2 w-full border border-ink/15 bg-paper px-4 py-3 text-base focus:border-accent focus:outline-none"
          />

          <div className="mt-2 max-h-64 overflow-y-auto border border-ink/10 bg-white">
            {isLoading ? (
              <PickupPointsSkeleton />
            ) : error ? (
              <p className="px-4 py-3 text-sm text-accent">{error}</p>
            ) : visiblePoints.length === 0 ? (
              <p className="px-4 py-3 text-sm text-ink/50">{t.empty}</p>
            ) : (
              <ul className="divide-y divide-ink/8">
                {visiblePoints.map((point) => (
                  <li key={`${point.carrier}-${point.id}`}>
                    <button
                      type="button"
                      onClick={() => handleChoosePoint(point)}
                      className="flex w-full flex-col items-start px-4 py-3 text-left transition-colors hover:bg-paper"
                    >
                      <span className="text-sm font-semibold text-ink">
                        {point.name}
                      </span>
                      <span className="mt-0.5 text-xs text-ink/55">
                        {point.address}
                        {point.city ? `, ${point.city}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setQuery("");
            }}
            className="mt-3 text-sm font-medium text-ink/60 underline-offset-2 hover:text-accent hover:underline"
          >
            {locale === "et" ? "Sulge" : "Close"}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={prefetching}
          className={cn(
            "mt-2 flex w-full items-center justify-between border px-4 py-3 text-left text-sm transition-colors",
            prefetching
              ? "cursor-wait border-ink/10 bg-white"
              : "border-ink/15 bg-paper hover:border-ink/30",
          )}
        >
          <span className={prefetching ? "text-ink/40" : "text-ink/60"}>
            {prefetching ? t.loading : t.choose}
          </span>
          {prefetching ? (
            <MorphLoading size="sm" className="!size-8" />
          ) : (
            <span className="text-ink/35" aria-hidden="true">
              →
            </span>
          )}
        </button>
      )}
    </div>
  );
}
