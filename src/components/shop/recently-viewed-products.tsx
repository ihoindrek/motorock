"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Swiper as SwiperInstance } from "swiper";
import { A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { BrandLogo } from "@/components/shop/brand-logo";
import { Price } from "@/components/shop/price";
import { CarouselArrow } from "@/components/ui/carousel-arrow";
import { useDictionary, useLocale } from "@/context/locale-context";
import type { Locale } from "@/i18n/config";
import { localizedProductHref } from "@/lib/shop/product-url";
import {
  readRecentlyViewed,
  type RecentlyViewedItem,
} from "@/lib/shop/recently-viewed";
import { cn } from "@/lib/utils";

import "swiper/css";

const MAX_SHOWN = 8;

type RecentlyViewedProductsProps = {
  /** Current product page slug — never show the product the buyer is on. */
  excludeSlug?: string;
  className?: string;
};

type CarouselNavState = {
  show: boolean;
  prev: boolean;
  next: boolean;
};

function RecentlyViewedCard({
  item,
  locale,
}: {
  item: RecentlyViewedItem;
  locale: Locale;
}) {
  const isMotorcycle = item.type === "motorcycle";

  return (
    <Link
      href={localizedProductHref(item.slug, locale)}
      className="flex h-full flex-col border border-ink/10 bg-paper outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
          sizes="(max-width: 640px) 40vw, (max-width: 1024px) 30vw, 25vw"
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
  );
}

export function RecentlyViewedProducts({
  excludeSlug,
  className = "",
}: RecentlyViewedProductsProps) {
  const locale = useLocale();
  const dict = useDictionary();
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [navState, setNavState] = useState<CarouselNavState>({
    show: false,
    prev: false,
    next: false,
  });

  const updateNavState = useCallback(
    (swiper: SwiperInstance) => {
      const hasOverflow = !swiper.isBeginning || !swiper.isEnd;

      setNavState({
        show: items.length > 1 && hasOverflow,
        prev: !swiper.isBeginning,
        next: !swiper.isEnd,
      });
    },
    [items.length],
  );

  // localStorage is only readable after mount; first-time visitors simply
  // never see this section.
  useEffect(() => {
    setItems(
      readRecentlyViewed()
        .filter((item) => item.slug !== excludeSlug)
        .slice(0, MAX_SHOWN),
    );
  }, [excludeSlug]);

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper) {
      return;
    }

    swiper.update();
    updateNavState(swiper);
  }, [items, updateNavState]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={dict.pdp.recentlyViewed}
      className={`relative overflow-hidden border-t border-ink/10 bg-paper pt-12 pb-10 sm:pt-16 sm:pb-14 ${className}`}
    >
      <div className="site-container">
        <h2 className="mb-6 font-body text-xl font-extrabold uppercase tracking-tight text-ink sm:mb-5 sm:text-2xl">
          {dict.pdp.recentlyViewed}
        </h2>

        <div className="w-full overflow-visible">
          <Swiper
            modules={[A11y]}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              updateNavState(swiper);
            }}
            onInit={updateNavState}
            onSlideChange={updateNavState}
            onResize={updateNavState}
            onBreakpoint={updateNavState}
            onReachBeginning={updateNavState}
            onReachEnd={updateNavState}
            observer
            observeParents
            resizeObserver
            spaceBetween={16}
            slidesPerView={1.15}
            slidesPerGroup={1}
            grabCursor
            speed={600}
            breakpoints={{
              640: { slidesPerView: 2.15, spaceBetween: 20 },
              1024: { slidesPerView: 6.15, spaceBetween: 20 },
            }}
            className="w-full !overflow-visible"
            aria-label={dict.pdp.recentlyViewed}
          >
            {items.map((item) => (
              <SwiperSlide key={item.slug} className="!h-auto">
                <RecentlyViewedCard item={item} locale={locale} />
              </SwiperSlide>
            ))}
          </Swiper>

          {navState.show ? (
            <nav
              aria-label={dict.carousel.navigation}
              className="mt-6 flex items-center justify-between sm:mt-8"
            >
              <CarouselArrow
                direction="prev"
                label={dict.carousel.previousProduct}
                text={dict.carousel.previous}
                onClick={() => swiperRef.current?.slidePrev()}
                disabled={!navState.prev}
                theme="light"
              />
              <CarouselArrow
                direction="next"
                label={dict.carousel.nextProduct}
                text={dict.carousel.next}
                onClick={() => swiperRef.current?.slideNext()}
                disabled={!navState.next}
                theme="light"
              />
            </nav>
          ) : null}
        </div>
      </div>
    </section>
  );
}
