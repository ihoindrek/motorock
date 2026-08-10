"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PickupPoint } from "@/types/pickup-point";
import type { ShippingRate } from "@/lib/shop/shipping-method";
import { MorphLoading } from "@/components/ui/morph-loading";
import { useLocale } from "@/context/locale-context";
import { getDictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";

type CheckoutPickupPointSelectorProps = {
  shippingRate: ShippingRate;
  country: string;
  selectedPoint: PickupPoint | null;
  complete?: boolean;
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
  selectedPoint,
  onSelect,
  complete = false,
}: CheckoutPickupPointSelectorProps) {
  const locale = useLocale();
  const t = getDictionary(locale).checkout;

  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
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

  const closeDropdown = () => {
    setIsOpen(false);
    setQuery("");
  };

  const openDropdown = () => {
    if (prefetching) {
      return;
    }

    setIsOpen(true);
  };

  useEffect(() => {
    // Parent clears selectedPoint when shipping rate/country changes.
    // Only reset local dropdown state here — calling onSelect(null) on remount
    // was wiping a valid locker selection after shipping rate list refreshes.
    setQuery("");
    setIsOpen(false);
    setPoints([]);
    setError(null);
    setLoading(false);
    setPrefetching(true);
  }, [rateKey]);

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
          throw new Error(payload.error ?? t.pickupPointError);
        }

        if (!cancelled) {
          setPoints(payload.points ?? []);
        }
      } catch (cause) {
        if (!cancelled) {
          setPoints([]);
          setError(cause instanceof Error ? cause.message : t.pickupPointError);
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
  }, [country, query, shippingRate, t.pickupPointError]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      searchRef.current?.focus();
    });

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const isLoading = prefetching || loading;
  const visiblePoints = useMemo(() => points, [points]);

  const handleChoosePoint = (point: PickupPoint) => {
    onSelect(point);
    closeDropdown();
  };

  return (
    <div
      id="checkout-pickup-point"
      ref={rootRef}
      className="relative mt-4 border-t border-ink/10 pt-5"
    >
      <div className="flex items-center justify-between gap-3">
        <label
          id={`pickup-point-label-${rateKey}`}
          className="inline-flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/50"
        >
          {t.pickupPointLabel}
          {complete ? (
            <span
              aria-hidden="true"
              className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-stock/40 bg-stock/10 text-[10px] font-bold leading-none text-stock"
            >
              ✓
            </span>
          ) : null}
        </label>
        {isLoading && !isOpen ? (
          <span className="inline-flex items-center gap-2 text-[11px] text-ink/45">
            <MorphLoading size="sm" className="!size-8" />
            {t.pickupPointLoading}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        id={`pickup-point-trigger-${rateKey}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={`pickup-point-label-${rateKey} pickup-point-trigger-${rateKey}`}
        disabled={prefetching}
        onClick={() => {
          if (isOpen) {
            closeDropdown();
            return;
          }

          openDropdown();
        }}
        className={cn(
          "mt-2 flex w-full items-center gap-3 border px-4 py-3 text-left text-sm transition-colors",
          isOpen || selectedPoint
            ? "border-accent bg-white shadow-sm"
            : "border-ink/15 bg-paper hover:border-ink/30 hover:bg-white",
          prefetching && "cursor-wait",
        )}
      >
        <span className="min-w-0 flex-1">
          {selectedPoint ? (
            <>
              <span className="block font-semibold text-ink">{selectedPoint.name}</span>
              <span className="mt-0.5 block text-xs text-ink/55">
                {selectedPoint.address}
                {selectedPoint.city ? `, ${selectedPoint.city}` : ""}
              </span>
            </>
          ) : (
            <span className={prefetching ? "text-ink/40" : "text-ink/60"}>
              {prefetching ? t.pickupPointLoading : t.pickupPointChoose}
            </span>
          )}
        </span>
        {prefetching ? (
          <MorphLoading size="sm" className="!size-8 shrink-0" />
        ) : (
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-ink/40 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
            aria-hidden="true"
          />
        )}
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 border border-ink/15 bg-white shadow-[0_12px_40px_rgb(11_11_11_/_0.12)]">
          <div className="flex items-center gap-2 border-b border-ink/10 px-3 py-2">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.pickupPointSearch}
              className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none"
            />
            <button
              type="button"
              onClick={closeDropdown}
              aria-label={t.pickupPointClose}
              className="inline-flex size-8 shrink-0 items-center justify-center text-ink/45 transition-colors hover:bg-paper hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div
            role="listbox"
            aria-label={t.pickupPointLabel}
            className="max-h-64 overflow-y-auto"
          >
            {isLoading ? (
              <PickupPointsSkeleton />
            ) : error ? (
              <p className="px-4 py-3 text-sm text-accent">{error}</p>
            ) : visiblePoints.length === 0 ? (
              <p className="px-4 py-3 text-sm text-ink/50">{t.pickupPointEmpty}</p>
            ) : (
              <ul className="divide-y divide-ink/8">
                {visiblePoints.map((point) => (
                  <li key={`${point.carrier}-${point.id}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selectedPoint?.id === point.id}
                      onClick={() => handleChoosePoint(point)}
                      className={cn(
                        "flex w-full flex-col items-start px-4 py-3 text-left transition-colors hover:bg-paper",
                        selectedPoint?.id === point.id && "bg-paper",
                      )}
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
        </div>
      ) : null}
    </div>
  );
}
