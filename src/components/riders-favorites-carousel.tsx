"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { CarouselArrow } from "@/components/ui/carousel-arrow";
import { formatPrice } from "@/lib/shop/category";

import "swiper/css";

export type FavoriteProduct = {
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  brandLogo?: string;
};

type CarouselTheme = "light" | "dark";
type FigureBackground = "moto" | "ink" | "detail" | "none";

const figureBackgroundClass: Record<FigureBackground, string> = {
  moto: "bg-moto",
  ink: "bg-ink",
  detail: "bg-detail",
  none: "",
};

function ProductBrandLogo({
  src,
  brand,
  theme,
  prominent = false,
}: {
  src: string;
  brand: string;
  theme: CarouselTheme;
  prominent?: boolean;
}) {
  return (
    <img
      src={src}
      alt={brand}
      className={`block w-auto object-contain object-left ${
        prominent ? "h-6 max-w-[132px] contrast-125" : "h-5 max-w-[120px]"
      } ${
        theme === "light" ? "brightness-0" : "brightness-0 invert"
      }`}
    />
  );
}

type FavoriteProductCardProps = {
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  brandLogo?: string;
  theme?: CarouselTheme;
  imageMultiply?: boolean;
  compact?: boolean;
  figureBackground?: FigureBackground;
  priority?: boolean;
};

export function FavoriteProductCard({
  slug,
  name,
  brand,
  price,
  image,
  brandLogo,
  theme = "dark",
  imageMultiply = false,
  compact = false,
  figureBackground,
  priority = false,
}: FavoriteProductCardProps) {
  const textClass = theme === "light" ? "text-ink" : "text-paper";
  const prominentMeta = theme === "light" && compact;
  const resolvedFigureBackground =
    figureBackground ?? (theme === "light" ? "moto" : "ink");
  const figureBg = figureBackgroundClass[resolvedFigureBackground];
  const bareFigure = resolvedFigureBackground === "none";

  return (
    <article className="flex h-full w-full flex-col">
      <Link
        href={`/shop/product/${slug}`}
        className="group flex h-full flex-col outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {compact ? (
          <figure
            className={`relative aspect-[4/3] w-full overflow-hidden ${figureBg}`}
          >
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-2/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none motion-reduce:group-hover:opacity-0 bg-[radial-gradient(ellipse_62%_100%_at_50%_100%,rgb(255_90_0_/_0.28),transparent_72%)]"
              aria-hidden="true"
            />
            <Image
              src={image}
              alt={name}
              fill
              priority={priority}
              className={`object-contain object-center p-2 transition-transform duration-500 ease-out sm:p-3 motion-reduce:transition-none motion-reduce:group-hover:scale-100 group-hover:scale-[1.06] ${
                imageMultiply ? "mix-blend-multiply" : ""
              }`}
              sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
            />
          </figure>
        ) : (
          <figure
            className={`relative aspect-[4/5] overflow-hidden ${figureBg}`}
          >
            <Image
              src={image}
              alt={name}
              fill
              priority={priority}
              className={
                bareFigure
                  ? "object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  : `object-contain object-center p-3 transition-opacity duration-300 group-hover:opacity-90 sm:p-4 ${
                      imageMultiply ? "mix-blend-multiply" : ""
                    }`
              }
              sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 25vw"
            />
          </figure>
        )}
        <div
          className={`flex flex-1 flex-col items-start ${compact ? "gap-1 pt-2" : "gap-1 pt-3"}`}
        >
          {brandLogo ? (
            <ProductBrandLogo
              src={brandLogo}
              brand={brand}
              theme={theme}
              prominent={prominentMeta}
            />
          ) : (
            <p
              className={`font-display text-[10px] font-bold uppercase tracking-aggressive sm:text-xs ${
                prominentMeta ? "text-ink" : "text-accent"
              }`}
            >
              {brand}
            </p>
          )}
          <h3
            className={`font-body text-base !normal-case leading-snug tracking-normal transition-colors duration-200 group-hover:text-accent sm:text-lg ${
              prominentMeta
                ? "font-bold text-ink"
                : `font-semibold ${textClass}`
            }`}
          >
            {name}
          </h3>
          <p
            className={`mt-auto font-display transition-colors duration-200 group-hover:text-accent ${
              compact ? "pt-1" : "pt-2"
            } ${
              prominentMeta
                ? "text-sm font-extrabold text-ink sm:text-base"
                : theme === "light"
                  ? "text-base font-extrabold text-ink sm:text-lg"
                  : `text-sm font-bold ${textClass}`
            }`}
          >
            {formatPrice(price)}
          </p>
        </div>
      </Link>
    </article>
  );
}

type RidersFavoritesCarouselProps = {
  products: readonly FavoriteProduct[];
  theme?: CarouselTheme;
  imageMultiply?: boolean;
  compact?: boolean;
  slideDividers?: boolean;
  figureBackground?: FigureBackground;
  /** Equipment-style peek on mobile (~1.15 slides visible). */
  mobilePeek?: boolean;
  /** Fixed slides per view with grouped navigation (e.g. 2 at a time). */
  slideGroup?: number;
};

export function RidersFavoritesCarousel({
  products,
  theme = "dark",
  imageMultiply = false,
  compact = false,
  slideDividers = false,
  figureBackground,
  mobilePeek = false,
  slideGroup,
}: RidersFavoritesCarouselProps) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const grouped = slideGroup != null && slideGroup > 0;

  useEffect(() => {
    swiperRef.current?.update();
  }, [products]);

  const showNavigation = grouped
    ? products.length > slideGroup
    : products.length > 1;
  const slideClassName = grouped
    ? "!h-auto"
    : mobilePeek
      ? "!h-auto"
      : "!relative !flex !h-auto !w-[82%] !overflow-visible sm:!w-[calc((100%-20px)/2)] lg:!w-[calc((100%-56px)/3)]";

  return (
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
        slidesPerView={grouped ? 2 : mobilePeek ? 1.15 : "auto"}
        slidesPerGroup={grouped ? slideGroup : 1}
        grabCursor
        speed={600}
        breakpoints={
          grouped
            ? {
                640: {
                  slidesPerView: 2,
                  slidesPerGroup: slideGroup,
                  spaceBetween: 20,
                },
                1024: {
                  slidesPerView: 4,
                  slidesPerGroup: slideGroup,
                  spaceBetween: 28,
                },
              }
            : mobilePeek
              ? undefined
              : {
                  640: { spaceBetween: 20 },
                  1024: { spaceBetween: 28 },
                }
        }
        className="w-full !overflow-visible"
      >
        {products.map((product, index) => (
          <SwiperSlide key={product.slug} className={slideClassName}>
            {slideDividers && index < products.length - 1 ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 top-1/2 z-10 h-[100px] w-px -translate-y-1/2 bg-white sm:-right-2.5 lg:-right-3.5"
              />
            ) : null}
            <FavoriteProductCard
              {...product}
              theme={theme}
              imageMultiply={imageMultiply}
              compact={compact}
              figureBackground={figureBackground}
              priority={index < 2}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {showNavigation ? (
        <nav
          aria-label="Carousel navigation"
          className="mt-8 flex items-center justify-between"
        >
        <CarouselArrow
          direction="prev"
          label="Previous product"
          onClick={() => swiperRef.current?.slidePrev()}
          theme={theme}
        />
        <CarouselArrow
          direction="next"
          label="Next product"
          onClick={() => swiperRef.current?.slideNext()}
          theme={theme}
        />
      </nav>
      ) : null}
    </div>
  );
}

type RidersFavoritesGridProps = {
  products: readonly FavoriteProduct[];
  theme?: CarouselTheme;
  imageMultiply?: boolean;
  compact?: boolean;
  figureBackground?: FigureBackground;
  columns?: 2 | 4;
};

export function RidersFavoritesGrid({
  products,
  theme = "dark",
  imageMultiply = false,
  compact = false,
  figureBackground,
  columns = 4,
}: RidersFavoritesGridProps) {
  const columnClass =
    columns === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : "sm:grid-cols-2";

  return (
    <ul
      className={`grid grid-cols-1 gap-x-6 gap-y-10 ${columnClass}`}
      aria-label="Featured products"
    >
      {products.map((product, index) => (
        <li key={product.slug}>
          <FavoriteProductCard
            {...product}
            theme={theme}
            imageMultiply={imageMultiply}
            compact={compact}
            figureBackground={figureBackground}
            priority={index < 4}
          />
        </li>
      ))}
    </ul>
  );
}
