"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  CarouselArrow,
  type CarouselArrowTheme,
} from "@/components/ui/carousel-arrow";

import "swiper/css";

const VISIBLE_THUMBS = 5;
const THUMB_SCROLL_STEP = 2;

type GalleryImageNavigation = {
  onPrevious: () => void;
  onNext: () => void;
  theme?: CarouselArrowTheme;
};

type GalleryThumbnailRailProps = {
  items: readonly string[];
  orientation: "vertical" | "horizontal";
  className?: string;
  activeIndex?: number;
  imageNavigation?: GalleryImageNavigation;
  viewportFadeClass?: string;
  onThumbSelect?: (index: number) => void;
  renderThumb: (src: string, index: number, select: () => void) => ReactNode;
};

export function GalleryThumbnailRail({
  items,
  orientation,
  className = "",
  activeIndex = 0,
  imageNavigation,
  viewportFadeClass = "from-detail",
  onThumbSelect,
  renderThumb,
}: GalleryThumbnailRailProps) {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [thumbScrollStart, setThumbScrollStart] = useState(0);
  const isVertical = orientation === "vertical";
  const needsThumbScroll = items.length > VISIBLE_THUMBS;
  const useSwiper = needsThumbScroll && !imageNavigation;

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper) {
      return;
    }

    if (imageNavigation && needsThumbScroll) {
      const visibleStart = swiper.activeIndex;
      const visibleEnd = visibleStart + VISIBLE_THUMBS - 1;

      if (activeIndex >= visibleStart && activeIndex <= visibleEnd) {
        return;
      }

      const maxStart = Math.max(items.length - VISIBLE_THUMBS, 0);
      const targetStart = Math.min(
        Math.max(activeIndex - VISIBLE_THUMBS + 1, 0),
        maxStart,
      );

      if (targetStart !== swiper.activeIndex) {
        swiper.slideTo(targetStart);
      }
      return;
    }

    if (!useSwiper) {
      return;
    }

    swiper.slideTo(Math.min(activeIndex, items.length - 1));
  }, [activeIndex, imageNavigation, isVertical, items.length, needsThumbScroll, useSwiper]);

  const updateEdges = (swiper: SwiperInstance) => {
    setAtStart(swiper.isBeginning);
    setAtEnd(swiper.isEnd);
    setThumbScrollStart(swiper.activeIndex);
  };

  const hiddenThumbsRemaining = Math.max(
    items.length - thumbScrollStart - VISIBLE_THUMBS,
    0,
  );

  const handleThumbSelect = (index: number) => {
    if (imageNavigation && needsThumbScroll && swiperRef.current) {
      const visibleEnd = thumbScrollStart + VISIBLE_THUMBS - 1;

      if (index === visibleEnd && !atEnd) {
        const maxStart = Math.max(items.length - VISIBLE_THUMBS, 0);
        swiperRef.current.slideTo(
          Math.min(thumbScrollStart + THUMB_SCROLL_STEP, maxStart),
        );
      }
    }

    onThumbSelect?.(index);
  };

  const bindSelect = (index: number) => () => handleThumbSelect(index);

  const prevLabel = isVertical ? "Scroll thumbnails up" : "Scroll thumbnails left";
  const nextLabel = isVertical ? "Scroll thumbnails down" : "Scroll thumbnails right";
  const verticalShellClass = className || "w-[4.25rem] sm:w-[5.25rem]";
  const verticalImageNavGapClass = imageNavigation ? "gap-3 sm:gap-4" : "";
  const verticalThumbViewportClass =
    "h-[calc(5*5rem+4*0.5rem)] w-full shrink-0 sm:h-[calc(5*6rem+4*0.5rem)]";

  const imageNavButtonClass =
    "relative flex h-11 w-full shrink-0 items-center justify-center transition-opacity duration-200 hover:opacity-80";

  const thumbList = (scrollable = false) => (
    <ul
      className={
        isVertical
          ? `flex w-full flex-col gap-2${scrollable ? " pb-1" : ""}`
          : `flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory ${className}`
      }
      aria-label="Product image thumbnails"
    >
        {items.map((src, index) => (
          <li key={src} className={isVertical ? undefined : "shrink-0 snap-start"}>
            {renderThumb(src, index, bindSelect(index))}
          </li>
        ))}
    </ul>
  );

  const imageNavButton = (direction: "prev" | "next") => (
    <CarouselArrow
      direction={direction}
      label={direction === "prev" ? "Previous image" : "Next image"}
      onClick={
        direction === "prev"
          ? imageNavigation!.onPrevious
          : imageNavigation!.onNext
      }
      variant="icon"
      orientation={isVertical ? "vertical" : "horizontal"}
      theme="light"
      className={imageNavButtonClass}
    />
  );

  const horizontalSlideClass = className || "w-[4.25rem]";

  const scrollNavButton = (direction: "prev" | "next", disabled: boolean) => (
    <div className="flex h-10 shrink-0 items-center justify-center">
      <CarouselArrow
        direction={direction}
        label={direction === "prev" ? prevLabel : nextLabel}
        onClick={() => {
          if (!swiperRef.current) {
            return;
          }

          if (imageNavigation && needsThumbScroll) {
            const maxStart = Math.max(items.length - VISIBLE_THUMBS, 0);
            const nextIndex =
              direction === "prev"
                ? Math.max(swiperRef.current.activeIndex - THUMB_SCROLL_STEP, 0)
                : Math.min(
                    swiperRef.current.activeIndex + THUMB_SCROLL_STEP,
                    maxStart,
                  );
            swiperRef.current.slideTo(nextIndex);
            return;
          }

          if (direction === "prev") {
            swiperRef.current.slidePrev();
          } else {
            swiperRef.current.slideNext();
          }
        }}
        variant="icon"
        orientation={isVertical ? "vertical" : "horizontal"}
        disabled={disabled}
      />
    </div>
  );

  const wrapThumbViewport = (content: ReactNode, axis: "vertical" | "horizontal") => (
    <div
      className={`relative ${
        axis === "vertical" ? verticalThumbViewportClass : "w-full"
      }`}
    >
      {content}
      {needsThumbScroll && !atStart ? (
        <div
          className={`pointer-events-none absolute z-10 ${
            axis === "vertical"
              ? `inset-x-0 top-0 h-8 bg-gradient-to-b ${viewportFadeClass} to-transparent`
              : `inset-y-0 left-0 w-8 bg-gradient-to-r ${viewportFadeClass} to-transparent`
          }`}
          aria-hidden="true"
        />
      ) : null}
      {needsThumbScroll && !atEnd ? (
        <div
          className={`pointer-events-none absolute z-10 ${
            axis === "vertical"
              ? `inset-x-0 bottom-0 h-10 bg-gradient-to-t ${viewportFadeClass} to-transparent`
              : `inset-y-0 right-0 w-10 bg-gradient-to-l ${viewportFadeClass} to-transparent`
          }`}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );

  const thumbRailMeta = (
    <div className="flex shrink-0 flex-col items-center gap-1 pt-1">
      <p className="font-body text-[10px] font-bold tabular-nums tracking-aggressive text-ink/70">
        {String(activeIndex + 1).padStart(2, "0")}
        <span className="text-ink/35">
          {" "}
          / {String(items.length).padStart(2, "0")}
        </span>
      </p>
      {needsThumbScroll && !atEnd && hiddenThumbsRemaining > 0 ? (
        <p className="font-body text-[9px] font-bold uppercase tracking-aggressive text-accent">
          +{hiddenThumbsRemaining} more
        </p>
      ) : null}
    </div>
  );

  const renderImageNavSwiper = (
    direction: "vertical" | "horizontal",
    slideClassName: string,
  ) => (
    <Swiper
      modules={[A11y]}
      direction={direction}
      slidesPerView={direction === "vertical" ? VISIBLE_THUMBS : 4.5}
      spaceBetween={8}
      onSwiper={(instance) => {
        swiperRef.current = instance;
        updateEdges(instance);
      }}
      onSlideChange={updateEdges}
      onResize={updateEdges}
      className={direction === "vertical" ? "size-full" : "w-full"}
      aria-label="Product image thumbnails"
    >
      {items.map((src, index) => (
        <SwiperSlide
          key={src}
          className={
            direction === "vertical"
              ? "!h-auto !w-full"
              : `${slideClassName} !h-auto shrink-0`
          }
        >
          {renderThumb(src, index, bindSelect(index))}
        </SwiperSlide>
      ))}
    </Swiper>
  );

  if (items.length === 0) {
    return null;
  }

  if (imageNavigation) {
    if (isVertical) {
      const thumbViewport = needsThumbScroll
        ? wrapThumbViewport(renderImageNavSwiper("vertical", ""), "vertical")
        : wrapThumbViewport(
            <div className="size-full overflow-hidden">{thumbList()}</div>,
            "vertical",
          );

      return (
        <div
          className={`flex h-full min-h-0 shrink-0 flex-col ${verticalShellClass} ${verticalImageNavGapClass}`}
        >
          {needsThumbScroll
            ? scrollNavButton("prev", atStart)
            : imageNavButton("prev")}
          {thumbViewport}
          {needsThumbScroll
            ? scrollNavButton("next", atEnd)
            : imageNavButton("next")}
          {items.length > 1 ? thumbRailMeta : null}
        </div>
      );
    }

    const thumbViewport = needsThumbScroll ? (
      wrapThumbViewport(
        renderImageNavSwiper("horizontal", horizontalSlideClass),
        "horizontal",
      )
    ) : (
      <div className="w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max gap-2" aria-label="Product image thumbnails">
          {items.map((src, index) => (
            <li key={src} className={`${horizontalSlideClass} shrink-0`}>
              {renderThumb(src, index, bindSelect(index))}
            </li>
          ))}
        </ul>
      </div>
    );

    return (
      <div className="flex w-full flex-col gap-2">
        {thumbViewport}
        {needsThumbScroll ? (
          <nav
            aria-label="Thumbnail navigation"
            className="flex items-center justify-between"
          >
            {scrollNavButton("prev", atStart)}
            {scrollNavButton("next", atEnd)}
          </nav>
        ) : null}
        {items.length > 1 ? thumbRailMeta : null}
      </div>
    );
  }

  if (!useSwiper) {
    if (isVertical) {
      return (
        <div
          className={`flex shrink-0 flex-col items-stretch ${verticalShellClass}`}
        >
          {thumbList()}
        </div>
      );
    }

    return thumbList();
  }

  const swiper = (
    <Swiper
      modules={[A11y]}
      direction={isVertical ? "vertical" : "horizontal"}
      slidesPerView={isVertical ? "auto" : 5}
      spaceBetween={8}
      onSwiper={(instance) => {
        swiperRef.current = instance;
        updateEdges(instance);
      }}
      onSlideChange={updateEdges}
      onResize={updateEdges}
      className={
        isVertical
          ? "max-h-[22rem] w-full sm:max-h-[24rem]"
          : "min-w-0 flex-1"
      }
      aria-label="Product image thumbnails"
    >
      {items.map((src, index) => (
        <SwiperSlide
          key={src}
          className={
            isVertical
              ? "!h-auto !w-full"
              : "!w-[4.25rem] shrink-0 sm:!w-[5.25rem]"
          }
        >
          {renderThumb(src, index, bindSelect(index))}
        </SwiperSlide>
      ))}
    </Swiper>
  );

  if (isVertical) {
    return (
      <div
        className={`flex shrink-0 flex-col items-stretch overflow-visible ${verticalShellClass}`}
      >
        {scrollNavButton("prev", atStart)}
        <div className="min-h-0 shrink-0">{swiper}</div>
        {scrollNavButton("next", atEnd)}
      </div>
    );
  }

  return (
    <div className={`flex min-w-0 flex-col gap-2 overflow-visible ${className}`}>
      {swiper}
      <nav
        aria-label="Thumbnail navigation"
        className="flex shrink-0 items-center justify-between"
      >
        {scrollNavButton("prev", atStart)}
        {scrollNavButton("next", atEnd)}
      </nav>
    </div>
  );
}

export function CraftGalleryThumbButton({
  src,
  index,
  total,
  selected,
  onSelect,
  onOpenLightbox,
  imageBackground = "surface",
}: {
  src: string;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
  onOpenLightbox: () => void;
  imageBackground?: "surface" | "moto" | "detail";
}) {
  const imageBgClass =
    imageBackground === "moto"
      ? "bg-moto"
      : imageBackground === "detail"
        ? "bg-detail"
        : "bg-surface";

  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onOpenLightbox}
      aria-label={`View image ${index + 1} of ${total}`}
      aria-current={selected ? "true" : undefined}
      className={`relative aspect-square w-full p-[2px] transition-all duration-200 ${
        selected
          ? "bg-gradient-to-br from-[#FF5A00] via-[#ff7e26] to-[#ff9c59] opacity-100"
          : "bg-ink/15 opacity-60 hover:bg-ink/30 hover:opacity-100"
      }`}
    >
      <span
        className={`relative block size-full overflow-hidden ${imageBgClass}`}
      >
        <Image
          src={src}
          alt=""
          fill
          sizes="96px"
          className="object-cover object-center"
        />
      </span>
    </button>
  );
}
