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

type RelatedProductsProps = {
  products: readonly CatalogProduct[];
  title?: string;
};

type CarouselNavState = {
  show: boolean;
  prev: boolean;
  next: boolean;
};

export function RelatedProducts({
  products,
  title,
}: RelatedProductsProps) {
  const dict = useDictionary();
  const swiperRef = useRef<SwiperInstance | null>(null);
  const heading = title ?? dict.pdp.relatedProducts;
  const [navState, setNavState] = useState<CarouselNavState>({
    show: false,
    prev: false,
    next: false,
  });

  const updateNavState = useCallback((swiper: SwiperInstance) => {
    const hasOverflow = !swiper.isBeginning || !swiper.isEnd;

    setNavState({
      show: products.length > 1 && hasOverflow,
      prev: !swiper.isBeginning,
      next: !swiper.isEnd,
    });
  }, [products.length]);

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
    <section
      aria-labelledby="related-products-heading"
      className="relative overflow-hidden bg-paper pt-16 pb-24 text-ink lg:pt-24"
    >
      <div className="site-container">
        <h2
          id="related-products-heading"
          className="mb-6 text-2xl font-extrabold uppercase text-ink sm:mb-5 sm:text-3xl"
        >
          {heading}
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
            spaceBetween={PRODUCT_CAROUSEL_SPACE.base}
            slidesPerView={1.15}
            slidesPerGroup={1}
            grabCursor
            speed={600}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: PRODUCT_CAROUSEL_SPACE.md,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: PRODUCT_CAROUSEL_SPACE.lg,
              },
            }}
            className="w-full !overflow-visible"
            aria-label={dict.carousel.similarProducts}
          >
            {products.map((product) => (
              <SwiperSlide key={product.slug} className="!h-auto">
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>

          {navState.show ? (
            <nav
              aria-label={dict.carousel.similarProductsNavigation}
              className="mt-8 flex items-center justify-between"
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
