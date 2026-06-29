"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/context/locale-context";
import type { ShippingRate } from "@/lib/shop/shipping-method";
import { parseShippingRateCost } from "@/lib/shop/shipping-method";
import { groupShippingRatesForCheckout } from "@/lib/shop/shipping-rate-priority";
import { formatCheckoutPrice } from "@/lib/shop/category";
import { ShippingMethodIcon } from "@/components/shop/shipping-method-icon";
import { MorphLoading } from "@/components/ui/morph-loading";
import { cn } from "@/lib/utils";

function formatRatePrice(cost: string | null, locale: "en" | "et") {
  const value = parseShippingRateCost(cost);
  return value === 0 ? null : formatCheckoutPrice(value, locale);
}

function ShippingRateButton({
  rate,
  selected,
  onSelect,
  freeLabel,
  locale,
}: {
  rate: ShippingRate;
  selected: boolean;
  onSelect: (rateId: string) => void;
  freeLabel: string;
  locale: "en" | "et";
}) {
  const price = formatRatePrice(rate.cost, locale);

  return (
    <button
      type="button"
      onClick={() => onSelect(rate.id)}
      className={cn(
        "flex w-full items-center gap-3 border px-3 py-2.5 text-left transition-colors sm:px-4 sm:py-3",
        selected
          ? "border-accent bg-white shadow-sm"
          : "border-ink/15 bg-paper hover:border-ink/30",
      )}
    >
      <ShippingMethodIcon rate={rate} className="size-9 sm:size-10" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug text-ink">
          {rate.label}
        </span>
      </span>
      <span className="shrink-0 font-body text-sm font-bold tabular-nums">
        {price ?? freeLabel}
      </span>
    </button>
  );
}

function CollapsedShippingSelection({
  rate,
  onChange,
  freeLabel,
  locale,
  changeLabel,
}: {
  rate: ShippingRate;
  onChange: () => void;
  freeLabel: string;
  locale: "en" | "et";
  changeLabel: string;
}) {
  const price = formatRatePrice(rate.cost, locale);

  return (
    <div className="flex items-center gap-3 border border-accent bg-white px-3 py-2.5 shadow-sm sm:px-4 sm:py-3">
      <ShippingMethodIcon rate={rate} className="size-9 sm:size-10" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-ink">{rate.label}</p>
        <p className="mt-0.5 font-body text-sm font-bold tabular-nums text-ink/80">
          {price ?? freeLabel}
        </p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className="shrink-0 text-xs font-medium text-ink/50 hover:text-accent"
      >
        {changeLabel}
      </button>
    </div>
  );
}

function ShippingRateSection({
  title,
  rates,
  selectedRateId,
  onSelect,
  freeLabel,
  locale,
}: {
  title: string;
  rates: ShippingRate[];
  selectedRateId: string | null;
  onSelect: (rateId: string) => void;
  freeLabel: string;
  locale: "en" | "et";
}) {
  if (rates.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="mb-2 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
        {title}
      </h3>
      <ul className="grid gap-2">
        {rates.map((rate) => (
          <li key={rate.id}>
            <ShippingRateButton
              rate={rate}
              selected={selectedRateId === rate.id}
              onSelect={onSelect}
              freeLabel={freeLabel}
              locale={locale}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CheckoutShippingLoadingState({
  message,
  size = "md",
}: {
  message: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 border border-ink/10 bg-white px-6 py-10 sm:py-12">
      <MorphLoading size={size} />
      <p className="max-w-xs text-center text-xs font-medium text-ink/50">{message}</p>
    </div>
  );
}

export function CheckoutShippingOptionsSkeleton({
  message,
}: {
  message?: string;
}) {
  const locale = useLocale();
  const defaultMessage =
    locale === "et" ? "Laen tarneviise…" : "Loading delivery options…";

  return (
    <CheckoutShippingLoadingState
      message={message ?? defaultMessage}
      size="md"
    />
  );
}

export function CheckoutShippingOptions({
  rates,
  selectedRateId,
  onSelect,
  syncing = false,
}: {
  rates: ShippingRate[];
  selectedRateId: string | null;
  onSelect: (rateId: string) => void;
  syncing?: boolean;
}) {
  const locale = useLocale();
  const [collapsed, setCollapsed] = useState(false);
  const ratesKey = useMemo(() => rates.map((rate) => rate.id).join("|"), [rates]);

  const selectedRate = useMemo(
    () => rates.find((rate) => rate.id === selectedRateId) ?? null,
    [rates, selectedRateId],
  );

  useEffect(() => {
    setCollapsed(false);
  }, [ratesKey]);

  const handleSelect = (rateId: string) => {
    onSelect(rateId);
    setCollapsed(true);
  };

  const t =
    locale === "et"
      ? {
          free: "Tasuta",
          pickup: "Pakiautomaadid",
          courier: "Kuller",
          updating: "Uuendan tarneviise…",
          change: "Muuda",
        }
      : {
          free: "Free",
          pickup: "Parcel machines",
          courier: "Courier",
          updating: "Updating delivery options…",
          change: "Change",
        };

  const { pickup, courier } = groupShippingRatesForCheckout(rates);
  const showCollapsed = collapsed && selectedRate && !syncing;

  return (
    <div className="relative">
      {syncing ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-paper/70 backdrop-blur-[2px]"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-3 rounded-sm border border-ink/10 bg-white px-8 py-6 shadow-[0_8px_32px_rgb(11_11_11/0.08)]">
            <MorphLoading size="sm" />
            <p className="text-xs font-medium text-ink/55">{t.updating}</p>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "transition-opacity duration-200",
          syncing && "opacity-60",
          !showCollapsed && "space-y-5",
        )}
      >
        {showCollapsed ? (
          <CollapsedShippingSelection
            rate={selectedRate}
            onChange={() => setCollapsed(false)}
            freeLabel={t.free}
            locale={locale}
            changeLabel={t.change}
          />
        ) : (
          <>
            <ShippingRateSection
              title={t.pickup}
              rates={pickup}
              selectedRateId={selectedRateId}
              onSelect={handleSelect}
              freeLabel={t.free}
              locale={locale}
            />
            <ShippingRateSection
              title={t.courier}
              rates={courier}
              selectedRateId={selectedRateId}
              onSelect={handleSelect}
              freeLabel={t.free}
              locale={locale}
            />
          </>
        )}
      </div>
    </div>
  );
}
