"use client";

import Link from "next/link";
import { useDictionary, useLocale } from "@/context/locale-context";
import {
  SHOWROOM,
  SHOWROOM_GOOGLE_MAPS_URL,
} from "@/data/showroom";
import { localizedHref } from "@/i18n/paths";
import type { ShippingRate } from "@/lib/shop/shipping-method";
import {
  findShowroomPickupRate,
  isShowroomPickupRate,
} from "@/lib/shop/shipping-showroom-pickup";
import { cn } from "@/lib/utils";

type ShowroomPickupPanelProps = {
  rates: readonly ShippingRate[];
  selectedRateId: string | null;
  onSelectRate: (rateId: string) => void;
  className?: string;
};

export function ShowroomPickupPanel({
  rates,
  selectedRateId,
  onSelectRate,
  className,
}: ShowroomPickupPanelProps) {
  const locale = useLocale();
  const dict = useDictionary();
  const pickupRate = findShowroomPickupRate(rates);
  const pickupSelected =
    selectedRateId !== null &&
    rates.some(
      (rate) => rate.id === selectedRateId && isShowroomPickupRate(rate),
    );

  return (
    <div
      className={cn(
        "border border-ink/10 bg-moto/60 px-4 py-4 sm:px-5 sm:py-5",
        className,
      )}
    >
      <p className="font-body text-sm font-extrabold uppercase leading-snug tracking-tight text-ink">
        {dict.showroom.pickupTitle}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink/65">
        {SHOWROOM.name} — {SHOWROOM.addressLine}, {SHOWROOM.city}.{" "}
        {dict.showroom.pickupDescription}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {pickupRate ? (
          <button
            type="button"
            onClick={() => onSelectRate(pickupRate.id)}
            className={cn(
              "inline-flex items-center rounded-full px-5 py-2.5 font-body text-[10px] font-bold uppercase tracking-aggressive transition-colors",
              pickupSelected
                ? "bg-ink text-paper"
                : "border border-ink/20 bg-paper text-ink hover:border-ink/40",
            )}
          >
            {pickupSelected
              ? dict.showroom.pickupSelected
              : dict.showroom.usePickup}
          </button>
        ) : null}
        <Link
          href={SHOWROOM_GOOGLE_MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45 transition-colors hover:text-accent"
        >
          {dict.showroom.directions}
        </Link>
      </div>
      {!pickupRate ? (
        <p className="mt-3 text-xs text-ink/50">{dict.showroom.pickupFallback}</p>
      ) : null}
    </div>
  );
}

type ShowroomPickupNoteProps = {
  className?: string;
};

export function ShowroomPickupNote({ className }: ShowroomPickupNoteProps) {
  const locale = useLocale();
  const dict = useDictionary();

  return (
    <p className={cn("text-sm leading-relaxed text-ink/60", className)}>
      <span className="font-semibold text-ink">{dict.showroom.tryBeforeBuy}</span>{" "}
      {dict.showroom.pickupNote} {SHOWROOM.addressLine}.{" "}
      <Link
        href={localizedHref(locale, "/contact")}
        className="text-ink underline-offset-2 hover:text-accent hover:underline"
      >
        {dict.showroom.visitUs}
      </Link>
    </p>
  );
}
