"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { MotorcycleImageStage } from "@/components/shop/motorcycle-image-stage";
import {
  GalleryImageTransition,
  useGallerySlideDirection,
} from "@/components/shop/gallery-image-transition";
import {
  CraftGalleryThumbButton,
  GalleryThumbnailRail,
} from "@/components/shop/gallery-thumbnail-rail";
import {
  OpenableImageTrigger,
  ProductImageLightbox,
} from "@/components/shop/product-image-lightbox";
import {
  ProductVideoModal,
} from "@/components/shop/product-video-modal";
import {
  buildGallerySlides,
  CRAFT_GALLERY_MAIN_STAGE_CLASS,
  GALLERY_VIDEO_THUMB_KEY,
  GalleryInlineVideoStage,
  type GalleryInlineVideoStageHandle,
  GalleryVideoThumbButton,
  gallerySlideRailKey,
  imageIndexToSlideIndex,
  isGalleryVideoThumbKey,
} from "@/components/shop/gallery-video-slide";
import { InStoreNowBadge } from "@/components/shop/in-store-now-badge";
import { CarouselArrow } from "@/components/ui/carousel-arrow";
import { useDictionary } from "@/context/locale-context";
import type { ProductVideo } from "@/lib/shop/parse-product-video";
import { cn } from "@/lib/utils";

const mobileFullBleedClass =
  "max-lg:relative max-lg:left-1/2 max-lg:w-screen max-lg:max-w-[100vw] max-lg:-translate-x-1/2";

type GalleryImageBackground = "surface" | "moto" | "detail" | "white";

function galleryImageBgClass(imageBackground: GalleryImageBackground) {
  switch (imageBackground) {
    case "moto":
      return "bg-moto";
    case "detail":
      return "bg-detail";
    case "white":
      return "bg-white";
    default:
      return "bg-surface";
  }
}

function galleryViewportFadeClass(imageBackground: GalleryImageBackground) {
  switch (imageBackground) {
    case "moto":
      return "from-moto";
    case "detail":
      return "from-detail";
    case "white":
      return "from-white";
    default:
      return "from-surface";
  }
}

type ProductImageGalleryProps = {
  images: readonly string[];
  alt: string;
  preferredImage?: string;
  variant?: "product" | "scene";
  theme?: "dark" | "light";
  layout?: "hero" | "compact" | "craft";
  imageBackground?: GalleryImageBackground;
  vimeoId?: string;
  productVideo?: ProductVideo;
  videoTitle?: string;
  inStoreNow?: boolean;
  fullBleedMobile?: boolean;
};

type GalleryThumbProps = {
  src: string;
  index: number;
  total: number;
  selected: boolean;
  variant: "product" | "scene";
  theme: "dark" | "light";
  onSelect: () => void;
  onOpenLightbox: () => void;
  compact?: boolean;
  style?: "default" | "craft";
  seamless?: boolean;
  fillRail?: boolean;
};

function GalleryThumb({
  src,
  index,
  total,
  selected,
  variant,
  theme,
  onSelect,
  onOpenLightbox,
  compact = false,
  seamless = false,
  fillRail = false,
}: GalleryThumbProps) {
  const isProduct = variant === "product";
  const sizeClass = compact
    ? "h-14 w-[4.25rem]"
    : fillRail
      ? "h-[4.5rem] w-full sm:h-20"
      : "h-[4.5rem] w-[5.5rem] sm:h-20 sm:w-24";

  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onOpenLightbox}
      aria-label={`View image ${index + 1} of ${total}`}
      aria-current={selected ? "true" : undefined}
      className={`group/thumb relative block overflow-hidden transition-all duration-300 ease-out ${sizeClass} ${
        isProduct
          ? selected
            ? "scale-100 border-2 border-accent opacity-100"
            : "scale-[0.96] border border-ink/25 opacity-45 hover:scale-[0.98] hover:border-ink/40 hover:opacity-90"
          : selected
            ? theme === "dark"
              ? "scale-100 opacity-100 ring-2 ring-accent ring-offset-2 ring-offset-ink"
              : "scale-100 opacity-100 ring-2 ring-accent ring-offset-2 ring-offset-paper"
            : theme === "dark"
              ? "scale-[0.96] opacity-40 hover:scale-[0.98] hover:opacity-80"
              : "scale-[0.96] opacity-45 hover:scale-[0.98] hover:opacity-90"
      } ${isProduct ? (theme === "light" ? "bg-white" : "bg-moto") : "bg-surface"}`}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="96px"
        className={
          isProduct
            ? "object-contain object-center p-1.5 mix-blend-multiply transition-transform duration-300 group-hover/thumb:scale-105"
            : "object-cover object-center transition-transform duration-300 group-hover/thumb:scale-105"
        }
      />
      <span
        className={`absolute inset-x-0 bottom-0 h-0.5 origin-left bg-accent transition-transform duration-300 ${
          selected ? "scale-x-100" : "scale-x-0"
        }`}
        aria-hidden="true"
      />
      <span
        className={`pointer-events-none absolute left-1 top-1 font-body text-[8px] font-bold tabular-nums tracking-widest ${
          theme === "dark" ? "text-paper/50" : "text-ink/40"
        } ${selected ? "text-accent" : ""}`}
        aria-hidden="true"
      >
        {String(index + 1).padStart(2, "0")}
      </span>
    </button>
  );
}

function SceneImageTile({
  src,
  alt,
  label,
  theme,
  onOpen,
  priority = false,
  imageBackground = "surface",
}: {
  src: string;
  alt: string;
  label: string;
  theme: "dark" | "light";
  onOpen: () => void;
  priority?: boolean;
  imageBackground?: GalleryImageBackground;
}) {
  const imageBgClass = galleryImageBgClass(imageBackground);

  return (
    <OpenableImageTrigger onOpen={onOpen} label={label} theme={theme}>
      <figure
        className={`relative aspect-[3/4] w-full overflow-hidden ring-1 ring-inset ring-ink/5 sm:aspect-[4/5] lg:min-h-[22rem] lg:aspect-auto xl:min-h-[26rem] ${
          theme === "dark" ? "bg-ink" : imageBgClass
        }`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 1024px) 50vw, 38vw"
          className="object-contain object-center p-1 transition-transform duration-500 group-hover/openable:scale-[1.03] sm:p-1.5"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/20 via-transparent to-transparent"
          aria-hidden="true"
        />
      </figure>
    </OpenableImageTrigger>
  );
}

function getDuoIndices(activeIndex: number, total: number) {
  if (total <= 1) {
    return [0] as const;
  }

  if (activeIndex >= total - 1) {
    return [total - 2, total - 1] as const;
  }

  return [activeIndex, activeIndex + 1] as const;
}

export function ProductImageGallery({
  images,
  alt,
  preferredImage,
  variant = "product",
  theme = "light",
  layout = "compact",
  imageBackground = "surface",
  vimeoId,
  productVideo: productVideoProp,
  videoTitle,
  inStoreNow = false,
  fullBleedMobile = false,
}: ProductImageGalleryProps) {
  const dict = useDictionary();
  const isHero = layout === "hero";
  const isProduct = variant === "product";
  const preferredIndex = preferredImage
    ? images.findIndex((src) => src === preferredImage)
    : -1;

  const productVideo =
    productVideoProp ??
    (vimeoId ? ({ provider: "vimeo", id: vimeoId } satisfies ProductVideo) : undefined);
  const [videoOpen, setVideoOpen] = useState(false);
  const inlineVideoRef = useRef<GalleryInlineVideoStageHandle>(null);
  const hasVideoSlide = Boolean(
    productVideo && (isHero || layout === "craft"),
  );
  const slides = useMemo(
    () => buildGallerySlides(images, hasVideoSlide),
    [hasVideoSlide, images],
  );
  const slideCount = slides.length;
  const posterSrc = images[0] ?? "";
  const preferredSlideIndex = imageIndexToSlideIndex(preferredIndex, slides);

  const [activeIndex, setActiveIndex] = useState(
    preferredSlideIndex >= 0 ? preferredSlideIndex : 0,
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const resolvedIndex =
    preferredImage && preferredIndex >= 0 ? preferredSlideIndex : activeIndex;
  const activeSlide = slides[resolvedIndex] ?? slides[0];
  const isVideoActive = activeSlide?.kind === "video";
  const activeSrc =
    preferredImage && preferredIndex < 0
      ? preferredImage
      : activeSlide?.kind === "image"
        ? activeSlide.src
        : images[0];
  const slideDirection = useGallerySlideDirection(resolvedIndex, slideCount);
  const railItems = slides.map(gallerySlideRailKey);

  useEffect(() => {
    if (preferredSlideIndex >= 0) {
      setActiveIndex(preferredSlideIndex);
    }
  }, [preferredImage, preferredSlideIndex]);

  const selectGallerySlide = (index: number) => {
    const slide = slides[index];
    if (slide?.kind === "video" && productVideo?.provider === "file") {
      flushSync(() => setActiveIndex(index));
      void inlineVideoRef.current?.play();
      return;
    }

    setActiveIndex(index);
  };

  const showPrevious = () => {
    setActiveIndex((index) => (index > 0 ? index - 1 : slideCount - 1));
  };

  const showNext = () => {
    setActiveIndex((index) => (index < slideCount - 1 ? index + 1 : 0));
  };

  const openLightboxAtSlide = (index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  };

  const lightboxProps = {
    images,
    alt,
    open: lightboxOpen,
    onClose: () => setLightboxOpen(false),
    variant,
    initialSlideIndex: resolvedIndex,
    ...(hasVideoSlide && productVideo
      ? {
          slides,
          productVideo,
          posterSrc,
          videoTitle: videoTitle ?? alt,
        }
      : {}),
  } as const;

  const renderSlideThumb = (
    src: string,
    index: number,
    select: () => void,
    style: "craft" | "default",
    options?: {
      compact?: boolean;
      fillRail?: boolean;
      onOpenLightbox?: () => void;
    },
  ) => {
    if (isGalleryVideoThumbKey(src)) {
      return (
        <GalleryVideoThumbButton
          posterSrc={posterSrc}
          index={index}
          total={slideCount}
          selected={index === resolvedIndex}
          onSelect={select}
          onOpenLightbox={() => openLightboxAtSlide(index)}
          imageBackground={imageBackground}
          style={style}
          theme={theme}
          compact={options?.compact}
          fillRail={options?.fillRail}
        />
      );
    }

    if (style === "craft") {
      return (
        <CraftGalleryThumbButton
          src={src}
          index={index}
          total={slideCount}
          selected={index === resolvedIndex}
          imageBackground={imageBackground}
          onSelect={select}
          onOpenLightbox={
            options?.onOpenLightbox ??
            (() => openLightboxAtSlide(index))
          }
        />
      );
    }

    return (
      <GalleryThumb
        src={src}
        index={index}
        total={slideCount}
        selected={index === resolvedIndex}
        variant={variant}
        theme={theme}
        compact={options?.compact}
        fillRail={options?.fillRail}
        seamless={false}
        onSelect={select}
        onOpenLightbox={
          options?.onOpenLightbox ??
          (() => openLightboxAtSlide(index))
        }
      />
    );
  };

  const thumbList = (
    orientation: "horizontal" | "vertical",
    compact?: boolean,
    railClassName?: string,
  ) => (
    <GalleryThumbnailRail
      items={railItems}
      orientation={orientation}
      activeIndex={resolvedIndex}
      className={
        railClassName ??
        (orientation === "vertical"
          ? "w-24 shrink-0"
          : "w-full")
      }
      onThumbSelect={selectGallerySlide}
      renderThumb={(src, index, select) =>
        renderSlideThumb(src, index, () => selectGallerySlide(index), "default", {
          compact,
          fillRail: orientation === "vertical",
        })
      }
    />
  );

  const slideCounter =
    slideCount > 1 ? (
      <span
        className={`pointer-events-none absolute left-3 top-3 z-10 font-body text-[10px] font-bold tabular-nums tracking-aggressive ${
          theme === "dark" ? "text-paper" : "text-ink"
        }`}
      >
        {String(resolvedIndex + 1).padStart(2, "0")}
        <span className={theme === "dark" ? "text-paper/35" : "text-ink/40"}>
          {" "}
          / {String(slideCount).padStart(2, "0")}
        </span>
      </span>
    ) : null;

  const inlineVideoStage =
    hasVideoSlide && productVideo ? (
      <GalleryInlineVideoStage
        ref={inlineVideoRef}
        video={productVideo}
        title={videoTitle ?? alt}
        posterSrc={posterSrc}
        expandLabel={dict.motorcycle.watchVideo}
        imageBackground={imageBackground}
        stageLayout={layout === "craft" || !isProduct ? "content" : "fill"}
        className={layout === "craft" || !isProduct ? undefined : "h-full"}
        onExpand={() => setVideoOpen(true)}
      />
    ) : null;

  if (images.length === 0) {
    return null;
  }

  if (!isProduct && layout === "craft") {
    const craftThumbRail = (orientation: "vertical" | "horizontal") => (
      <GalleryThumbnailRail
        items={railItems}
        orientation={orientation}
        activeIndex={resolvedIndex}
        className={orientation === "vertical" ? "w-20 sm:w-24" : "w-[4.25rem]"}
        viewportFadeClass={galleryViewportFadeClass(imageBackground)}
        imageNavigation={{
          onPrevious: showPrevious,
          onNext: showNext,
          theme,
        }}
        onThumbSelect={selectGallerySlide}
        renderThumb={(src, index, select) =>
          renderSlideThumb(src, index, () => selectGallerySlide(index), "craft")
        }
      />
    );

    return (
      <div className="flex flex-col gap-1.5 lg:gap-3">
        <div className="flex flex-col gap-1.5 lg:flex-row lg:items-start lg:gap-2.5">
          <div
            className={cn(
              "min-w-0 flex-1",
              fullBleedMobile && mobileFullBleedClass,
            )}
          >
            {isVideoActive ? (
              <div
                className="w-full max-lg:rounded-none"
                onDoubleClick={() => openLightboxAtSlide(resolvedIndex)}
                onTouchStart={(event) => {
                  const touch = event.changedTouches[0];
                  if (!touch) return;
                  (event.currentTarget as HTMLElement).dataset.touchStartX =
                    String(touch.clientX);
                }}
                onTouchEnd={(event) => {
                  const startX = Number(
                    (event.currentTarget as HTMLElement).dataset.touchStartX,
                  );
                  const touch = event.changedTouches[0];
                  if (!touch || Number.isNaN(startX)) return;
                  const delta = touch.clientX - startX;
                  if (Math.abs(delta) < 40) return;
                  if (delta < 0) showNext();
                  else showPrevious();
                }}
              >
                <GalleryImageTransition
                  imageKey="gallery-video"
                  direction={slideDirection}
                  sizeToContent
                  className="w-full max-lg:rounded-none"
                >
                  <div className="relative">
                    {inlineVideoStage}
                    {slideCounter}
                  </div>
                </GalleryImageTransition>
              </div>
            ) : (
              <OpenableImageTrigger
                onOpen={() => setLightboxOpen(true)}
                label={`Open ${alt} full size`}
                theme={theme}
                onSwipeLeft={slideCount > 1 ? showNext : undefined}
                onSwipeRight={slideCount > 1 ? showPrevious : undefined}
              >
                <GalleryImageTransition
                  imageKey={activeSrc}
                  direction={slideDirection}
                  sizeToContent
                  className="w-full max-lg:rounded-none"
                >
                  <figure
                    className={cn(
                      CRAFT_GALLERY_MAIN_STAGE_CLASS,
                      "max-lg:leading-none",
                      galleryImageBgClass(imageBackground),
                    )}
                  >
                    <Image
                      src={activeSrc}
                      alt={alt}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 42vw"
                      className="object-contain object-top p-0.5 transition-transform duration-500 group-hover/openable:scale-[1.01] sm:p-1"
                    />
                    {slideCounter}
                  </figure>
                </GalleryImageTransition>
              </OpenableImageTrigger>
            )}
          </div>

          {slideCount > 1 ? (
            <div className="hidden shrink-0 lg:flex">
              {craftThumbRail("vertical")}
            </div>
          ) : null}
        </div>

        {slideCount > 1 ? (
          <div className="lg:hidden">{craftThumbRail("horizontal")}</div>
        ) : null}

        <ProductImageLightbox {...lightboxProps} />

        {hasVideoSlide && productVideo ? (
          <ProductVideoModal
            video={productVideo}
            title={videoTitle ?? `Watch ${alt}`}
            open={videoOpen}
            onClose={() => setVideoOpen(false)}
          />
        ) : null}
      </div>
    );
  }

  if (!isProduct) {
    const duoIndices = getDuoIndices(resolvedIndex, images.length);

    return (
      <div className="flex flex-col gap-3">
        <div
          className={`grid gap-2 sm:gap-3 lg:gap-4 ${
            duoIndices.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {duoIndices.map((index, tile) => (
            <SceneImageTile
              key={`${images[index]}-${index}`}
              src={images[index]}
              alt={`${alt} (${index + 1} of ${images.length})`}
              label={`Open ${alt} image ${index + 1} full size`}
              theme={theme}
              priority={tile === 0}
              onOpen={() => {
                setActiveIndex(index);
                setLightboxOpen(true);
              }}
            />
          ))}
        </div>

        {images.length > 2 ? (
          <GalleryThumbnailRail
            items={images}
            orientation="horizontal"
            activeIndex={resolvedIndex}
            onThumbSelect={setActiveIndex}
            renderThumb={(src, index, select) => (
              <GalleryThumb
                src={src}
                index={index}
                total={images.length}
                selected={index === resolvedIndex}
                variant={variant}
                theme={theme}
                compact
                onSelect={select}
                onOpenLightbox={() => {
                  setActiveIndex(index);
                  setLightboxOpen(true);
                }}
              />
            )}
          />
        ) : null}

        <ProductImageLightbox {...lightboxProps} />
      </div>
    );
  }

  const mainStage = (
    <div
      className={cn(
        "relative min-w-0 flex-1",
        fullBleedMobile && mobileFullBleedClass,
      )}
    >
      {isVideoActive ? (
        <div
          className="relative w-full max-lg:rounded-none"
          onDoubleClick={() => openLightboxAtSlide(resolvedIndex)}
        >
          <GalleryImageTransition
            imageKey="gallery-video"
            direction={slideDirection}
            className={
              isProduct
                ? isHero
                  ? "aspect-[4/3] w-full max-lg:rounded-none sm:aspect-[3/2] lg:aspect-auto lg:min-h-[min(58vh,34rem)] xl:min-h-[min(62vh,38rem)]"
                  : "aspect-[4/3] w-full max-lg:rounded-none"
                : "aspect-[4/5] w-full"
            }
          >
            <div className="relative h-full">
              {inlineVideoStage}
              {slideCounter}
            </div>
          </GalleryImageTransition>
        </div>
      ) : (
        <OpenableImageTrigger
          onOpen={() => openLightboxAtSlide(resolvedIndex)}
          label={`Open ${alt} full size`}
          theme={theme}
          onSwipeLeft={slideCount > 1 ? showNext : undefined}
          onSwipeRight={slideCount > 1 ? showPrevious : undefined}
        >
          <GalleryImageTransition
            imageKey={activeSrc}
            direction={slideDirection}
            className={
              isProduct
                ? isHero
                  ? "aspect-[4/3] w-full max-lg:rounded-none sm:aspect-[3/2] lg:aspect-auto lg:min-h-[min(58vh,34rem)] xl:min-h-[min(62vh,38rem)]"
                  : "aspect-[4/3] w-full max-lg:rounded-none"
                : "aspect-[4/5] w-full"
            }
          >
            {isProduct ? (
              <MotorcycleImageStage
                src={activeSrc}
                alt={alt}
                priority
                sizes={
                  isHero
                    ? "(max-width: 1024px) 100vw, 55vw"
                    : "(max-width: 1024px) 100vw, 50vw"
                }
                aspectClass="h-full"
                className="h-full"
                seamless={false}
                theme={theme}
              />
            ) : (
              <figure
                className={`relative h-full w-full overflow-hidden ${
                  theme === "dark" ? "bg-ink" : "bg-surface"
                } ring-1 ring-inset ring-ink/5`}
              >
                <Image
                  src={activeSrc}
                  alt={alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain object-center p-0.5 transition-transform duration-500 group-hover/openable:scale-[1.02] sm:p-1"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent opacity-60"
                  aria-hidden="true"
                />
              </figure>
            )}
          </GalleryImageTransition>
        </OpenableImageTrigger>
      )}

      {inStoreNow && isHero ? (
        <InStoreNowBadge
          variant="overlay"
          className={
            slideCount > 1
              ? "left-3 right-auto top-12 sm:top-14"
              : "left-3 right-auto"
          }
        />
      ) : null}

      {slideCounter}

      {slideCount > 1 ? (
        <nav
          aria-label={dict.carousel.galleryNavigation}
          className="mt-3 flex items-center justify-between"
        >
          <CarouselArrow
            direction="prev"
            label={dict.carousel.previousImage}
            text={dict.carousel.previous}
            onClick={showPrevious}
            theme={theme}
          />
          <CarouselArrow
            direction="next"
            label={dict.carousel.nextImage}
            text={dict.carousel.next}
            onClick={showNext}
            theme={theme}
          />
        </nav>
      ) : null}
    </div>
  );

  return (
    <div className={isHero ? "flex flex-col gap-4" : "flex flex-col gap-4"}>
      <div
        className={
          isHero
            ? "flex flex-col gap-4 lg:flex-row lg:items-start"
            : "flex flex-col gap-4 sm:flex-row sm:items-start"
        }
      >
        {isHero ? (
          <>
            {mainStage}
            {slideCount > 1 ? (
              <div className="hidden w-24 shrink-0 flex-col gap-3 lg:flex">
                {thumbList("vertical")}
              </div>
            ) : null}
          </>
        ) : (
          <>
            {slideCount > 1 ? (
              <div className="hidden w-24 shrink-0 lg:flex">
                {thumbList("vertical")}
              </div>
            ) : null}
            {mainStage}
          </>
        )}
      </div>

      {slideCount > 1 ? (
        <div className="flex flex-col gap-3 lg:hidden">
          {thumbList("horizontal")}
        </div>
      ) : null}

      <ProductImageLightbox {...lightboxProps} />

      {hasVideoSlide && productVideo ? (
        <ProductVideoModal
          video={productVideo}
          title={videoTitle ?? `Watch ${alt}`}
          open={videoOpen}
          onClose={() => setVideoOpen(false)}
        />
      ) : null}
    </div>
  );
}
