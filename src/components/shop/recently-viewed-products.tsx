"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/shop/brand-logo";
import { Price } from "@/components/shop/price";
import { useDictionary, useLocale } from "@/context/locale-context";
import { localizedProductHref } from "@/lib/shop/product-url";
import { cn } from "@/lib/utils";
import {
  readRecentlyViewed,
  type RecentlyViewedItem,
} from "@/lib/shop/recently-viewed";

const MAX_SHOWN = 8;

type RecentlyViewedProductsProps = {
  /** Current product page slug — never show the product the buyer is on. */
  excludeSlug?: string;
  className?: string;
};

export function RecentlyViewedProducts({
  excludeSlug,
  className = "",
}: RecentlyViewedProductsProps) {
  const locale = useLocale();
  const dict = useDictionary();
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  // localStorage is only readable after mount; first-time visitors simply
  // never see this section.
  useEffect(() => {
    setItems(
      readRecentlyViewed()
        .filter((item) => item.slug !== excludeSlug)
        .slice(0, MAX_SHOWN),
    );
  }, [excludeSlug]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={dict.pdp.recentlyViewed}
      className={`site-container py-10 sm:py-14 ${className}`}
    >
      <h2 className="mb-6 font-body text-xl font-extrabold uppercase tracking-tight text-ink sm:text-2xl">
        {dict.pdp.recentlyViewed}
      </h2>
      <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {items.map((item) => {
          const isMotorcycle = item.type === "motorcycle";

          return (
          <li
            key={item.slug}
            className="w-40 shrink-0 snap-start border border-ink/10 bg-paper sm:w-48"
          >
            <Link
              href={localizedProductHref(item.slug, locale)}
              className="flex h-full flex-col outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <figure
                className={cn(
                  "relative overflow-hidden",
                  isMotorcycle ? "aspect-[4/3] bg-moto" : "aspect-[4/5] bg-detail",
                )}
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 40vw, 192px"
                  className={cn(
                    isMotorcycle
                      ? "object-contain object-center p-2 mix-blend-multiply sm:p-3"
                      : "object-cover object-center",
                  )}
                />
              </figure>
              <div className="flex flex-1 flex-col gap-1 p-3">
                {item.brand ? <BrandLogo brand={item.brand} size="sm" /> : null}
                <h3 className="line-clamp-2 font-body text-sm font-semibold leading-snug text-ink">
                  {item.name}
                </h3>
                <Price value={item.price} as="p" className="mt-auto text-sm" />
              </div>
            </Link>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
