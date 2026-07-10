"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  RidersFavoritesCarousel,
  type FavoriteProduct,
} from "@/components/riders-favorites-carousel";
import { useCategoryTree } from "@/context/category-tree-context";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import type { WcCategoryNode } from "@/lib/graphql/categories";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";
import { buildEquipmentRootCategoryHref } from "@/lib/shop/equipment-route";
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

export function PopularGearSection({
  locale,
  productsByAudience,
  copy,
}: PopularGearSectionProps) {
  const tree = useCategoryTree();

  const tabs = useMemo(() => {
    const tabConfig: readonly {
      id: GearAudience;
      wcSlug: "for-men" | "for-women" | "accessories";
      node: WcCategoryNode | null | undefined;
    }[] = [
      { id: "men", wcSlug: "for-men", node: tree?.forMen },
      { id: "women", wcSlug: "for-women", node: tree?.forWomen },
      { id: "accessories", wcSlug: "accessories", node: tree?.accessories },
    ];

    return tabConfig
      .filter((tab) => productsByAudience[tab.id].length > 0)
      .map((tab) => ({
        id: tab.id,
        label: copy.tabs[tab.id],
        href: localizedHref(
          locale,
          buildEquipmentRootCategoryHref(tab.node, tab.wcSlug, locale),
        ),
      }));
  }, [copy.tabs, locale, productsByAudience, tree]);

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
            href={localizedHref(locale, buildEquipmentHubHref(locale))}
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
            imageMultiply={activeTab?.id === "accessories"}
            compact={false}
            slideDividers={false}
            figureBackground={activeTab?.id === "accessories" ? "moto" : "none"}
            slideGroup={2}
          />
        </div>
      </div>
    </section>
  );
}
