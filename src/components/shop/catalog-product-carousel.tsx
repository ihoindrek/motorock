"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { CatalogProduct } from "@/types/catalog-product";
import { ProductCard } from "@/components/shop/product-card";
import { CarouselArrow } from "@/components/ui/carousel-arrow";
import { useDictionary } from "@/context/locale-context";
import { PRODUCT_CAROUSEL_SPACE } from "@/lib/shop/product-grid-layout";

import "swiper/css";

type CatalogProductCarouselProps = {
  products: readonly CatalogProduct[];
  ariaLabel?: string;
  slideGroup?: number;
};

type CarouselNavState = {
  show: boolean;
  prev: boolean;
  next: boolean;
};

export function CatalogProductCarousel({
  products,
  ariaLabel,
  slideGroup = 1,
}: CatalogProductCarouselProps) {
  const dict = useDictionary();
  const swiperRef = useRef<SwiperInstance | null>(null);
  const grouped = slideGroup > 1;
  const [navState, setNavState] = useState<CarouselNavState>({
    show: false,
    prev: false,
    next: false,
  });

  const updateNavState = useCallback(
    (swiper: SwiperInstance) => {
      const hasOverflow = !swiper.isBeginning || !swiper.isEnd;

      setNavState({
        show: products.length > 1 && hasOverflow,
        prev: !swiper.isBeginning,
        next: !swiper.isEnd,
      });
    },
    [products.length],
  );

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper) {
      return;
    }

    swiper.update();
    updateNavState(swiper);
  }, [products, updateNavState]);

  if (products.length === 0) {
    return null;
  }

  return (
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
        spaceBetween={PRODUCT_CAROUSEL_SPACE.base}
        slidesPerView={grouped ? 2 : 1.15}
        slidesPerGroup={grouped ? slideGroup : 1}
        grabCursor
        speed={600}
        breakpoints={
          grouped
            ? {
                640: {
                  slidesPerView: 2,
                  slidesPerGroup: slideGroup,
                  spaceBetween: PRODUCT_CAROUSEL_SPACE.md,
                },
                1024: {
                  slidesPerView: 4,
                  slidesPerGroup: slideGroup,
                  spaceBetween: PRODUCT_CAROUSEL_SPACE.lg,
                },
              }
            : {
                640: {
                  slidesPerView: 2,
                  spaceBetween: PRODUCT_CAROUSEL_SPACE.md,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: PRODUCT_CAROUSEL_SPACE.lg,
                },
              }
        }
        className="w-full !overflow-visible"
        aria-label={ariaLabel ?? dict.carousel.featuredProducts}
      >
        {products.map((product) => (
          <SwiperSlide key={product.slug} className="!h-auto isolate">
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>

      {navState.show ? (
        <nav
          aria-label={dict.carousel.navigation}
          className="mt-10 flex items-center justify-between sm:mt-12"
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
  );
}
