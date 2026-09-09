"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CatalogProductCarousel } from "@/components/shop/catalog-product-carousel";
import type { CatalogProduct } from "@/types/catalog-product";
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
  productsByAudience: Record<GearAudience, readonly CatalogProduct[]>;
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

  const renderTabButton = (
    tab: (typeof tabs)[number],
    options?: { mobileProminent?: boolean },
  ) => {
    const isActive = tab.id === activeTab?.id;

    return (
      <button
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={isActive}
        onClick={() => setActiveId(tab.id)}
        className={cn(
          "inline-flex min-h-10 shrink-0 items-center justify-center px-4 py-2 text-center font-body text-xs font-bold uppercase tracking-aggressive transition-colors sm:px-5",
          options?.mobileProminent &&
            "min-h-12 w-full px-2 text-[10px] leading-tight sm:min-h-10 sm:w-auto sm:px-5 sm:text-xs sm:leading-normal",
          options?.mobileProminent ? "whitespace-normal" : "whitespace-nowrap",
          isActive
            ? "bg-ink text-paper"
            : options?.mobileProminent
              ? "border border-ink/15 bg-white text-ink/70 hover:border-ink/30 hover:text-ink"
              : "text-ink/60 hover:bg-surface hover:text-ink",
        )}
      >
        {tab.label}
      </button>
    );
  };

  return (
    <section
      aria-labelledby="favorites-equipment"
      className="home-section-padding relative overflow-hidden bg-white text-ink"
    >
      <div className="site-container relative z-10">
        <header className="home-section-header">
          <div>
            <p className="section-eyebrow">{copy.eyebrow}</p>
            <h3 id="favorites-equipment" className="heading-block mt-3 text-ink sm:mt-4">
              {copy.title}
            </h3>
          </div>
          <Link
            href={localizedHref(locale, buildEquipmentHubHref(locale))}
            className="inline-flex shrink-0 items-center rounded-full bg-paper px-7 py-3 font-body text-xs font-bold uppercase tracking-aggressive text-ink transition-colors duration-200 hover:bg-accent hover:text-paper"
          >
            {copy.cta}
          </Link>
        </header>

        <div
          className={cn(
            "mb-6 grid gap-3 sm:hidden",
            tabs.length === 1 && "grid-cols-1",
            tabs.length === 2 && "grid-cols-2",
            tabs.length >= 3 && "grid-cols-3",
          )}
          role="tablist"
          aria-label={copy.title}
        >
          {tabs.map((tab) => renderTabButton(tab, { mobileProminent: true }))}
        </div>

        <div
          className="mb-8 hidden gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:flex sm:gap-3 lg:mb-10 [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label={copy.title}
        >
          {tabs.map((tab) => renderTabButton(tab))}
        </div>

        <div role="tabpanel" aria-labelledby="favorites-equipment">
          <CatalogProductCarousel
            key={activeTab?.id}
            products={products}
            slideGroup={2}
            ariaLabel={copy.title}
          />
        </div>
      </div>
    </section>
  );
}
