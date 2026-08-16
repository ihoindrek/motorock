"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { CartSuggestionProduct } from "@/app/api/cart/suggestions/route";
import { Price } from "@/components/shop/price";
import { useLocale } from "@/context/locale-context";
import { trackViewItemList } from "@/lib/analytics/events";
import { localizedProductHref } from "@/lib/shop/product-url";
import type { CatalogProduct } from "@/types/catalog-product";

import "swiper/css";

type CartDrawerSuggestionsProps = {
  sourceSlug: string | null;
  excludeSlugs: readonly string[];
  title: string;
  onNavigate?: () => void;
};

export function CartDrawerSuggestions({
  sourceSlug,
  excludeSlugs,
  title,
  onNavigate,
}: CartDrawerSuggestionsProps) {
  const locale = useLocale();
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [products, setProducts] = useState<CartSuggestionProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const trackedKeyRef = useRef("");

  const excludeKey = useMemo(() => excludeSlugs.join(","), [excludeSlugs]);

  useEffect(() => {
    if (!sourceSlug) {
      setProducts([]);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          slug: sourceSlug,
          locale,
          exclude: excludeKey,
        });

        const response = await fetch(`/api/cart/suggestions?${params}`, {
          signal: controller.signal,
        });

        const payload = (await response.json()) as {
          products?: CartSuggestionProduct[];
        };

        if (cancelled) {
          return;
        }

        setProducts(payload.products ?? []);
      } catch {
        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [excludeKey, locale, sourceSlug]);

  useEffect(() => {
    if (products.length === 0) {
      return;
    }

    const key = `${sourceSlug}:${products.map((product) => product.slug).join(",")}`;
    if (trackedKeyRef.current === key) {
      return;
    }

    trackedKeyRef.current = key;
    trackViewItemList({
      listId: "cart_drawer_suggestions",
      listName: "Cart drawer suggestions",
      products: products as CatalogProduct[],
    });
  }, [products, sourceSlug]);

  if (!sourceSlug || (!loading && products.length === 0)) {
    return null;
  }

  return (
    <section aria-labelledby="cart-drawer-suggestions-heading" className="mt-5">
      <h3
        id="cart-drawer-suggestions-heading"
        className="font-body text-[11px] font-bold uppercase tracking-aggressive text-ink"
      >
        {title}
      </h3>

      {loading ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[3/4] animate-pulse rounded-sm bg-ink/5"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : (
        <div className="mt-3 -mx-1">
          <Swiper
            modules={[A11y]}
            onSwiper={(instance) => {
              swiperRef.current = instance;
            }}
            spaceBetween={12}
            slidesPerView={2.15}
            slidesPerGroup={1}
            grabCursor
            speed={450}
            className="w-full !overflow-visible px-1"
            aria-label={title}
          >
            {products.map((product) => (
              <SwiperSlide key={product.slug} className="!h-auto">
                <Link
                  href={localizedProductHref(product.slug, locale)}
                  onClick={onNavigate}
                  className="group block outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <figure className="relative aspect-[3/4] overflow-hidden rounded-sm border border-ink/10 bg-white">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="160px"
                      className="object-contain object-center p-1 transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </figure>
                  {product.brand ? (
                    <p className="mt-2 font-body text-[9px] font-bold uppercase tracking-aggressive text-ink/45">
                      {product.brand}
                    </p>
                  ) : null}
                  <p className="mt-1 line-clamp-2 text-xs font-bold leading-snug text-ink group-hover:text-accent">
                    {product.name}
                  </p>
                  <Price value={product.price} variant="sm" as="p" className="mt-1" />
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </section>
  );
}
