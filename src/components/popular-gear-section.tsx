"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  RidersFavoritesCarousel,
  type FavoriteProduct,
} from "@/components/riders-favorites-carousel";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import { cn } from "@/lib/utils";

type GearAudience = "men" | "women" | "accessories";

type PopularGearCopy = {
  eyebrow: string;
  title: string;
  cta: string;
  tabs: Record<GearAudience, string>;
};

type PopularGearSectionProps = {
  locale: Locale;
  productsByAudience: Record<GearAudience, readonly FavoriteProduct[]>;
  copy: PopularGearCopy;
};

const tabConfig: readonly {
  id: GearAudience;
  href: string;
}[] = [
  { id: "men", href: "/shop/equipment/men" },
  { id: "women", href: "/shop/equipment/women" },
  { id: "accessories", href: "/shop/equipment/accessories" },
];

export function PopularGearSection({
  locale,
  productsByAudience,
  copy,
}: PopularGearSectionProps) {
  const tabs = useMemo(
    () =>
      tabConfig
        .filter((tab) => productsByAudience[tab.id].length > 0)
        .map((tab) => ({
          ...tab,
          label: copy.tabs[tab.id],
          href: localizedHref(locale, tab.href),
        })),
    [copy.tabs, locale, productsByAudience],
  );

  const [activeId, setActiveId] = useState<GearAudience>(
    () => tabs[0]?.id ?? "men",
  );

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  const products = activeTab ? productsByAudience[activeTab.id] : [];

  if (tabs.length === 0 || products.length === 0) {
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
            <p className="section-eyebrow">{copy.eyebrow}</p>
            <h3 id="favorites-equipment" className="heading-block mt-2 text-ink">
              {copy.title}
            </h3>
          </div>
          <Link
            href={activeTab?.href ?? localizedHref(locale, "/shop/equipment")}
            className="inline-flex items-center self-start rounded-full bg-paper px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-ink transition-colors duration-200 hover:bg-accent hover:text-paper sm:self-auto"
          >
            {copy.cta}
          </Link>
        </header>

        <div
          className="mb-6 flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label={copy.title}
        >
          {tabs.map((tab) => {
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
