"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { GrainOverlay } from "@/components/ui/grain-overlay";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import {
  getEquipmentHubData,
  type EquipmentHubCategory,
} from "@/data/equipment-hub";
import { cn } from "@/lib/utils";

function MobileCategoryPanel({
  category,
  locale,
  exploreLabel,
}: {
  category: EquipmentHubCategory;
  locale: Locale;
  exploreLabel: string;
}) {
  return (
    <Link
      href={localizedHref(locale, category.href)}
      className="group relative flex min-h-[46svh] items-end overflow-hidden bg-ink sm:min-h-[52svh]"
    >
      <Image
        src={category.image}
        alt={category.imageAlt}
        fill
        sizes="100vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <GrainOverlay variant="dark" hero fadeUp />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/15"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-accent/0 transition-colors duration-300 group-hover:bg-accent/10"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full p-6 sm:p-8">
        <p className="font-body text-[10px] font-bold uppercase tracking-[0.35em] text-paper/45">
          {category.index}
        </p>
        <h2 className="mt-2 font-display text-4xl font-extrabold uppercase leading-[0.92] tracking-tight text-paper sm:text-5xl">
          {category.titleLines?.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          )) ?? category.title}
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-paper/70">
          {category.description}
        </p>
        <span className="btn-hero-ghost mt-5 inline-flex px-5 py-3 sm:px-6">
          {exploreLabel}
        </span>
      </div>
    </Link>
  );
}

function DesktopCategoryIndex({
  categories,
  activeId,
  onActiveChange,
  locale,
}: {
  categories: readonly EquipmentHubCategory[];
  activeId: string;
  onActiveChange: (id: string) => void;
  locale: Locale;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {categories.map((category) => {
        const isActive = category.id === activeId;

        return (
          <li key={category.id}>
            <Link
              href={localizedHref(locale, category.href)}
              onMouseEnter={() => onActiveChange(category.id)}
              onFocus={() => onActiveChange(category.id)}
              className={cn(
                "group flex items-baseline gap-4 border-l-2 py-4 pl-5 transition-colors duration-300",
                isActive
                  ? "border-accent text-paper"
                  : "border-paper/10 text-paper/45 hover:border-paper/30 hover:text-paper/80",
              )}
            >
              <span
                className={cn(
                  "font-body text-[10px] font-bold uppercase tracking-[0.35em] transition-colors",
                  isActive ? "text-accent" : "text-paper/30",
                )}
              >
                {category.index}
              </span>
              <span className="font-display text-[clamp(1.9rem,3.5vw,3rem)] font-extrabold uppercase leading-[0.92] tracking-tight transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
                {category.title}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function EquipmentHubView({ locale }: { locale: Locale }) {
  const { categories, copy: equipmentHubCopy, brands: equipmentHubBrands } =
    getEquipmentHubData(locale);
  const ui =
    locale === "et"
      ? {
          explore: "Avasta",
          home: "Avaleht",
          categories: "Kategooriad",
          featuredBrands: "Esiletõstetud brändid",
        }
      : {
          explore: "Explore",
          home: "Home",
          categories: "Categories",
          featuredBrands: "Featured brands",
        };

  const [activeId, setActiveId] = useState<string>(categories[0].id);
  const activeCategory =
    categories.find((category) => category.id === activeId) ?? categories[0];

  return (
    <div className="bg-ink">
      <section className="relative min-h-[52svh] overflow-hidden sm:min-h-[58svh] lg:min-h-[62svh]">
        <Image
          src={equipmentHubCopy.heroImage}
          alt={equipmentHubCopy.heroImageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <GrainOverlay variant="dark" hero fadeUp />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/25"
          aria-hidden="true"
        />

        <p
          aria-hidden="true"
          className="section-outline-heading pointer-events-none absolute bottom-[12%] right-[4%] z-[1] hidden max-w-[min(48vw,28rem)] text-right text-[clamp(3rem,11vw,7rem)] leading-[0.85] sm:block lg:right-[8%]"
        >
          {equipmentHubCopy.outline}
        </p>

        <div className="site-container relative z-10 flex min-h-[52svh] flex-col justify-end pb-10 pt-28 sm:min-h-[58svh] sm:pb-12 lg:min-h-[62svh] lg:pb-16">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 font-body text-[10px] font-bold uppercase tracking-aggressive text-paper/45">
              <li>
                <Link
                  href={localizedHref(locale, "/")}
                  className="transition-colors hover:text-accent"
                >
                  {ui.home}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-paper/80">{equipmentHubCopy.title}</li>
            </ol>
          </nav>

          <p className="section-eyebrow text-paper/55">{equipmentHubCopy.eyebrow}</p>
          <h1 className="mt-3 max-w-4xl font-display text-[clamp(3rem,8.8vw,6rem)] font-extrabold uppercase leading-[0.9] tracking-tight text-paper">
            {equipmentHubCopy.title}
            <span className="block bg-gradient-to-r from-[#FF5A00] via-[#ff7e26] to-[#ff9c59] bg-clip-text text-transparent">
              {equipmentHubCopy.accent}
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-paper/70 sm:text-lg">
            {equipmentHubCopy.description}
          </p>
        </div>
      </section>

      <section
        aria-label="Equipment categories"
        className="hidden lg:block"
      >
        <div className="site-container grid grid-cols-12 items-start gap-10 py-16 xl:gap-14 xl:py-20">
          <div className="col-span-5 xl:col-span-4">
            <p className="font-body text-[10px] font-bold uppercase tracking-[0.35em] text-paper/35">
              {ui.categories}
            </p>
            <div className="mt-6">
              <DesktopCategoryIndex
                categories={categories}
                activeId={activeId}
                onActiveChange={setActiveId}
                locale={locale}
              />
            </div>
          </div>

          <div className="relative col-span-7 min-h-[38rem] xl:col-span-8 xl:min-h-[42rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory.id}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 overflow-hidden border border-paper/10 bg-ink"
              >
                <Image
                  src={activeCategory.image}
                  alt={activeCategory.imageAlt}
                  fill
                  sizes="(max-width: 1280px) 58vw, 50vw"
                  className="object-cover"
                  priority={activeCategory.id === categories[0].id}
                />
                <GrainOverlay variant="dark" subtle />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent"
                  aria-hidden="true"
                />

                <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-4 p-8 xl:p-10">
                  <div className="max-w-md">
                    <p className="font-body text-[10px] font-bold uppercase tracking-[0.35em] text-paper/45">
                      {activeCategory.index}
                    </p>
                    <h2 className="mt-2 font-display text-5xl font-extrabold uppercase leading-[0.92] tracking-tight text-paper xl:text-6xl">
                      {activeCategory.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-paper/70 sm:text-base">
                      {activeCategory.description}
                    </p>
                  </div>
                  <Link
                    href={localizedHref(locale, activeCategory.href)}
                    className="btn-hero-primary shrink-0"
                  >
                    {ui.explore}
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <section
        aria-label="Equipment categories"
        className="flex flex-col lg:hidden"
      >
        {categories.map((category) => (
          <MobileCategoryPanel
            key={category.id}
            category={category}
            locale={locale}
            exploreLabel={ui.explore}
          />
        ))}
      </section>

      <section className="border-t border-paper/10 bg-ink py-12 lg:py-14">
        <div className="site-container">
          <p className="font-body text-[10px] font-bold uppercase tracking-[0.35em] text-paper/35">
            {ui.featuredBrands}
          </p>
          <ul className="mt-5 flex flex-wrap gap-3">
            {equipmentHubBrands.map((brand) => (
              <li key={brand.name}>
                <Link
                  href={localizedHref(locale, brand.href)}
                  className="inline-flex min-h-11 items-center border border-paper/15 px-5 py-2 font-body text-[10px] font-bold uppercase tracking-aggressive text-paper/70 transition-colors hover:border-accent hover:text-accent"
                >
                  {brand.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
