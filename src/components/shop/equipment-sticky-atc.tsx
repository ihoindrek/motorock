"use client";

import { useDictionary } from "@/context/locale-context";
import { Price } from "@/components/shop/price";
import { cn } from "@/lib/utils";

type EquipmentStickyAtcProps = {
  name: string;
  price: number;
  inStock: boolean;
  added: boolean;
  visible: boolean;
  onAdd: () => void;
};

export function EquipmentStickyAtc({
  name,
  price,
  inStock,
  added,
  visible,
  onAdd,
}: EquipmentStickyAtcProps) {
  const dict = useDictionary();

  if (!inStock) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-paper/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] transition-transform duration-300 lg:hidden",
        visible ? "translate-y-0" : "translate-y-full pointer-events-none",
      )}
      aria-hidden={!visible}
    >
      <div className="site-container flex items-center gap-3 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{name}</p>
          <Price value={price} variant="sm" className="mt-0.5 text-accent" />
        </div>
        <button
          type="button"
          onClick={onAdd}
          tabIndex={visible ? 0 : -1}
          className="shrink-0 bg-ink px-5 py-3 font-body text-[10px] font-bold uppercase tracking-aggressive text-paper transition-colors hover:bg-accent"
        >
          {added ? dict.pdp.addedToCart : dict.pdp.addToCart}
        </button>
      </div>
    </div>
  );
}
