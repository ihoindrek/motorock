"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  RidersFavoritesCarousel,
  type FavoriteProduct,
} from "@/components/riders-favorites-carousel";
import { cn } from "@/lib/utils";

type GearAudience = "men" | "women" | "accessories";

type PopularGearSectionProps = {
  productsByAudience: Record<GearAudience, readonly FavoriteProduct[]>;
};

const tabs: readonly {
  id: GearAudience;
  label: string;
  href: string;
}[] = [
  { id: "men", label: "For men", href: "/shop/equipment/men" },
  { id: "women", label: "For women", href: "/shop/equipment/women" },
  { id: "accessories", label: "Accessories", href: "/shop/equipment/accessories" },
];

export function PopularGearSection({
  productsByAudience,
}: PopularGearSectionProps) {
  const availableTabs = useMemo(
    () => tabs.filter((tab) => productsByAudience[tab.id].length > 0),
    [productsByAudience],
  );

  const [activeId, setActiveId] = useState<GearAudience>(
    () => availableTabs[0]?.id ?? "men",
  );

  const activeTab =
    availableTabs.find((tab) => tab.id === activeId) ?? availableTabs[0];
  const products = activeTab ? productsByAudience[activeTab.id] : [];

  if (availableTabs.length === 0 || products.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="favorites-equipment"
      className="relative overflow-hidden bg-detail py-20 text-ink lg:py-24"
    >
      <div className="site-container relative z-10">
        <header className="mb-6 flex flex-col gap-4 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-eyebrow">Equipment</p>
            <h3
              id="favorites-equipment"
              className="mt-2 text-2xl font-extrabold uppercase text-ink sm:text-3xl"
            >
              Popular Gear
            </h3>
          </div>
          <Link
            href={activeTab?.href ?? "/shop/equipment"}
            className="inline-flex items-center self-start rounded-full bg-paper px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-ink transition-colors duration-200 hover:bg-accent hover:text-paper sm:self-auto"
          >
            Shop equipment →
          </Link>
        </header>

        <div
          className="mb-6 flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Popular gear categories"
        >
          {availableTabs.map((tab) => {
            const isActive = tab.id === activeTab?.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveId(tab.id)}
                className={cn(
                  "inline-flex min-h-10 shrink-0 items-center whitespace-nowrap px-4 py-2 font-body text-xs font-bold uppercase tracking-aggressive transition-colors sm:px-5",
                  isActive
                    ? "bg-ink text-paper"
                    : "text-ink/60 hover:bg-surface hover:text-ink",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" aria-labelledby="favorites-equipment">
          <RidersFavoritesCarousel
            key={activeTab?.id}
            products={products}
            theme="light"
            imageMultiply={false}
            compact={false}
            slideDividers={false}
            figureBackground="none"
            slideGroup={2}
          />
        </div>
      </div>
    </section>
  );
}
