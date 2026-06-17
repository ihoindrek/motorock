import Link from "next/link";
import {
  SHOWROOM,
  SHOWROOM_GOOGLE_MAPS_URL,
} from "@/data/showroom";
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
        Pick up at showroom & try on
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink/65">
        {SHOWROOM.name} — {SHOWROOM.addressLine}, {SHOWROOM.city}. Reserve online,
        try gear or see bikes in person before you commit.
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
            {pickupSelected ? "Showroom pickup selected" : "Use showroom pickup"}
          </button>
        ) : null}
        <Link
          href={SHOWROOM_GOOGLE_MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45 transition-colors hover:text-accent"
        >
          Directions →
        </Link>
      </div>
      {!pickupRate ? (
        <p className="mt-3 text-xs text-ink/50">
          Mention showroom pickup in your order notes or choose the closest
          pickup option below — we&apos;ll hold items for you.
        </p>
      ) : null}
    </div>
  );
}

type ShowroomPickupNoteProps = {
  className?: string;
};

export function ShowroomPickupNote({ className }: ShowroomPickupNoteProps) {
  return (
    <p className={cn("text-sm leading-relaxed text-ink/60", className)}>
      <span className="font-semibold text-ink">Try before you buy.</span> Pick up
      at our Tallinn showroom — {SHOWROOM.addressLine}.{" "}
      <Link href="/contact" className="text-ink underline-offset-2 hover:text-accent hover:underline">
        Visit us
      </Link>
    </p>
  );
}
