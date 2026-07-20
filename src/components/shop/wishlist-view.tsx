"use client";

import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/shop/brand-logo";
import { Price } from "@/components/shop/price";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { useDictionary, useLocale } from "@/context/locale-context";
import { useWishlist } from "@/context/wishlist-context";
import { localizedHref } from "@/i18n/paths";
import { localizedProductHref } from "@/lib/shop/product-url";
import { buildEquipmentHubHref } from "@/lib/shop/category-url";

export function WishlistView() {
  const locale = useLocale();
  const dict = useDictionary();
  const { items, count, hydrated, remove } = useWishlist();

  if (!hydrated) {
    return (
      <div className="site-container py-16">
        <p className="text-sm text-ink/50">{dict.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="bg-detail">
      <div className="site-container py-10 sm:py-14">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-accent">
              {dict.wishlist.eyebrow}
            </p>
            <h1 className="mt-2 font-body text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
              {dict.wishlist.title}
            </h1>
            {count > 0 ? (
              <p className="mt-2 text-sm text-ink/55">
                {count} {count === 1 ? dict.wishlist.item : dict.wishlist.items}
              </p>
            ) : null}
          </div>
        </header>

        {count === 0 ? (
          <div className="border border-ink/10 bg-paper px-6 py-12 text-center sm:px-10">
            <p className="text-base text-ink/70">{dict.wishlist.empty}</p>
            <Link
              href={localizedHref(locale, buildEquipmentHubHref(locale))}
              className="mt-6 inline-flex bg-ink px-6 py-3 font-body text-[11px] font-bold uppercase tracking-aggressive text-paper transition-colors hover:bg-accent"
            >
              {dict.wishlist.emptyCta}
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <li
                key={item.slug}
                className="relative flex flex-col border border-ink/10 bg-paper"
              >
                <div className="absolute right-3 top-3 z-10">
                  <WishlistButton item={item} />
                </div>
                <Link
                  href={localizedProductHref(item.slug, locale)}
                  className="flex flex-1 flex-col outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <figure className="relative aspect-[4/5] overflow-hidden bg-detail">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-center"
                    />
                  </figure>
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    {item.brand ? (
                      <BrandLogo brand={item.brand} size="sm" />
                    ) : null}
                    <h2 className="font-body text-base font-semibold leading-snug text-ink">
                      {item.name}
                    </h2>
                    <Price value={item.price} as="p" className="mt-auto" />
                  </div>
                </Link>
                <div className="flex gap-2 border-t border-ink/10 p-3">
                  <Link
                    href={localizedProductHref(item.slug, locale)}
                    className="flex min-h-10 flex-1 items-center justify-center bg-ink px-3 font-body text-[10px] font-bold uppercase tracking-aggressive text-paper transition-colors hover:bg-accent"
                  >
                    {dict.wishlist.viewProduct}
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(item.slug)}
                    className="min-h-10 shrink-0 border border-ink/15 px-3 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/55 transition-colors hover:border-ink hover:text-ink"
                  >
                    {dict.wishlist.remove}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
