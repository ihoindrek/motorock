"use client";

import { Price } from "@/components/shop/price";
import { TestRideIcon } from "@/components/ui/test-ride-icon";

type MotorcycleCtaBarProps = {
  name: string;
  color: string;
  price: number;
  inStock: boolean;
  showroomAvailable: boolean;
  onPrimaryClick: () => void;
};

export function MotorcycleCtaBar({
  name,
  color,
  price,
  inStock,
  showroomAvailable,
  onPrimaryClick,
}: MotorcycleCtaBarProps) {
  if (!inStock) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-ink/10 bg-paper/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="site-container flex items-center gap-4 py-3 sm:gap-6 sm:py-3.5">
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/45">
            {color}
          </p>
          <p className="truncate text-sm font-bold sm:text-base">{name}</p>
        </div>
        <Price
          value={price}
          variant="lg"
          className="hidden text-accent sm:block"
        />
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onPrimaryClick}
            className="btn-accent gap-2 px-5 py-2.5 sm:px-6 sm:py-3"
          >
            {showroomAvailable ? (
              <>
                <TestRideIcon />
                Book test ride
              </>
            ) : (
              "Enquire"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
