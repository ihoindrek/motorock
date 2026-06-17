"use client";

import { useEffect, useRef } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { CatalogProduct } from "@/types/catalog-product";
import { ProductCard } from "@/components/shop/product-card";
import { CarouselArrow } from "@/components/ui/carousel-arrow";

import "swiper/css";

type RelatedProductsProps = {
  products: readonly CatalogProduct[];
  title?: string;
};

export function RelatedProducts({
  products,
  title = "Similar products",
}: RelatedProductsProps) {
  const swiperRef = useRef<SwiperInstance | null>(null);

  useEffect(() => {
    swiperRef.current?.update();
  }, [products]);

  if (products.length === 0) {
    return null;
  }

  const showNavigation = products.length > 1;

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
          {title}
        </h2>

        <div className="w-full overflow-visible">
          <Swiper
            modules={[A11y]}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            observer
            observeParents
            resizeObserver
            spaceBetween={16}
            slidesPerView={1.15}
            grabCursor
            speed={600}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 4, spaceBetween: 28 },
            }}
            className="w-full !overflow-visible"
            aria-label="Similar products"
          >
            {products.map((product) => (
              <SwiperSlide key={product.slug} className="!h-auto">
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>

          {showNavigation ? (
            <nav
              aria-label="Similar products navigation"
              className="mt-8 flex items-center justify-between"
            >
              <CarouselArrow
                direction="prev"
                label="Previous product"
                onClick={() => swiperRef.current?.slidePrev()}
                theme="light"
              />
              <CarouselArrow
                direction="next"
                label="Next product"
                onClick={() => swiperRef.current?.slideNext()}
                theme="light"
              />
            </nav>
          ) : null}
        </div>
      </div>
    </section>
  );
}
