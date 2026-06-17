"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
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
  GalleryVideoPlayButton,
  ProductVideoModal,
} from "@/components/shop/product-video-modal";
import { InStoreNowBadge } from "@/components/shop/in-store-now-badge";
import { CarouselArrow } from "@/components/ui/carousel-arrow";
import { cn } from "@/lib/utils";

const mobileFullBleedClass =
  "max-lg:relative max-lg:left-1/2 max-lg:w-screen max-lg:max-w-[100vw] max-lg:-translate-x-1/2";

type ProductImageGalleryProps = {
  images: readonly string[];
  alt: string;
  preferredImage?: string;
  variant?: "product" | "scene";
  theme?: "dark" | "light";
  layout?: "hero" | "compact" | "craft";
  imageBackground?: "surface" | "moto" | "detail";
  vimeoId?: string;
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
      } ${isProduct ? "bg-moto" : "bg-surface"}`}
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
        className={`pointer-events-none absolute left-1 top-1 font-display text-[8px] font-bold tabular-nums tracking-widest ${
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
  imageBackground?: "surface" | "moto" | "detail";
}) {
  const imageBgClass =
    imageBackground === "moto"
      ? "bg-moto"
      : imageBackground === "detail"
        ? "bg-detail"
        : "bg-surface";

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
          className="object-cover object-center transition-transform duration-500 group-hover/openable:scale-[1.03]"
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
  videoTitle,
  inStoreNow = false,
  fullBleedMobile = false,
}: ProductImageGalleryProps) {
  const isHero = layout === "hero";
  const isProduct = variant === "product";
  const preferredIndex = preferredImage
    ? images.findIndex((src) => src === preferredImage)
    : -1;

  const [activeIndex, setActiveIndex] = useState(
    preferredIndex >= 0 ? preferredIndex : 0,
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const showGalleryVideo = Boolean(vimeoId && isHero);

  const resolvedIndex =
    preferredImage && preferredIndex >= 0 ? preferredIndex : activeIndex;
  const activeSrc =
    preferredImage && preferredIndex < 0
      ? preferredImage
      : (images[resolvedIndex] ?? images[0]);
  const slideDirection = useGallerySlideDirection(resolvedIndex, images.length);

  useEffect(() => {
    if (preferredIndex >= 0) {
      setActiveIndex(preferredIndex);
    }
  }, [preferredIndex, preferredImage]);

  const showPrevious = () => {
    setActiveIndex((index) => (index > 0 ? index - 1 : images.length - 1));
  };

  const showNext = () => {
    setActiveIndex((index) => (index < images.length - 1 ? index + 1 : 0));
  };

  const thumbList = (
    orientation: "horizontal" | "vertical",
    compact?: boolean,
    railClassName?: string,
  ) => (
    <GalleryThumbnailRail
      items={images}
      orientation={orientation}
      activeIndex={resolvedIndex}
      className={
        railClassName ??
        (orientation === "vertical"
          ? "w-24 shrink-0"
          : "w-full")
      }
      onThumbSelect={setActiveIndex}
      renderThumb={(src, index, select) => (
        <GalleryThumb
          src={src}
          index={index}
          total={images.length}
          selected={index === resolvedIndex}
          variant={variant}
          theme={theme}
          compact={compact}
          fillRail={orientation === "vertical"}
          seamless={false}
          onSelect={select}
          onOpenLightbox={() => {
            setActiveIndex(index);
            setLightboxOpen(true);
          }}
        />
      )}
    />
  );

  const galleryVideoTrigger = (
    layout: "row" | "column",
    className?: string,
  ) =>
    showGalleryVideo ? (
      <GalleryVideoPlayButton
        theme={theme}
        layout={layout}
        className={className}
        onClick={() => setVideoOpen(true)}
      />
    ) : null;

  if (images.length === 0) {
    return null;
  }

  if (!isProduct && layout === "craft") {
    const craftThumbRail = (orientation: "vertical" | "horizontal") => (
      <GalleryThumbnailRail
        items={images}
        orientation={orientation}
        activeIndex={resolvedIndex}
        className={orientation === "vertical" ? "w-20 sm:w-24" : "w-[4.25rem]"}
        viewportFadeClass="from-detail"
        imageNavigation={{
          onPrevious: showPrevious,
          onNext: showNext,
          theme,
        }}
        onThumbSelect={setActiveIndex}
        renderThumb={(src, index, select) => (
          <CraftGalleryThumbButton
            src={src}
            index={index}
            total={images.length}
            selected={index === resolvedIndex}
            imageBackground={imageBackground}
            onSelect={select}
            onOpenLightbox={() => {
              setActiveIndex(index);
              setLightboxOpen(true);
            }}
          />
        )}
      />
    );

    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-2.5">
          <div
            className={cn(
              "min-w-0 flex-1",
              fullBleedMobile && mobileFullBleedClass,
            )}
          >
            <OpenableImageTrigger
              onOpen={() => setLightboxOpen(true)}
              label={`Open ${alt} full size`}
              theme={theme}
              onSwipeLeft={images.length > 1 ? showNext : undefined}
              onSwipeRight={images.length > 1 ? showPrevious : undefined}
            >
              <GalleryImageTransition
                imageKey={activeSrc}
                direction={slideDirection}
                className="aspect-[3/4] w-full max-lg:rounded-none sm:aspect-[4/5]"
              >
                <figure
                  className={`relative h-full w-full overflow-hidden ${
                    imageBackground === "moto"
                      ? "bg-moto"
                      : imageBackground === "detail"
                        ? "bg-detail"
                        : "bg-surface"
                  }`}
                >
                  <Image
                    src={activeSrc}
                    alt={alt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="object-cover object-center transition-transform duration-500 group-hover/openable:scale-[1.01]"
                  />
                  {images.length > 1 ? (
                    <span className="pointer-events-none absolute left-3 top-3 z-10 font-display text-[10px] font-bold tabular-nums tracking-aggressive text-ink">
                      {String(resolvedIndex + 1).padStart(2, "0")}
                      <span className="text-ink/40">
                        {" "}
                        / {String(images.length).padStart(2, "0")}
                      </span>
                    </span>
                  ) : null}
                </figure>
              </GalleryImageTransition>
            </OpenableImageTrigger>
          </div>

          {images.length > 1 ? (
            <div className="hidden h-full min-h-0 shrink-0 lg:flex">
              {craftThumbRail("vertical")}
            </div>
          ) : null}
        </div>

        {images.length > 1 ? (
          <div className="lg:hidden">{craftThumbRail("horizontal")}</div>
        ) : null}

        <ProductImageLightbox
          images={images}
          alt={alt}
          initialIndex={resolvedIndex}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          variant={variant}
        />
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

        <ProductImageLightbox
          images={images}
          alt={alt}
          initialIndex={resolvedIndex}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          variant={variant}
        />
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
      <OpenableImageTrigger
        onOpen={() => setLightboxOpen(true)}
        label={`Open ${alt} full size`}
        theme={theme}
        onSwipeLeft={images.length > 1 ? showNext : undefined}
        onSwipeRight={images.length > 1 ? showPrevious : undefined}
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
                className="object-cover object-center transition-transform duration-500 group-hover/openable:scale-[1.02]"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent opacity-60"
                aria-hidden="true"
              />
            </figure>
          )}
        </GalleryImageTransition>
      </OpenableImageTrigger>

      {inStoreNow && isHero ? (
        <InStoreNowBadge
          variant="overlay"
          className={
            images.length > 1
              ? "left-3 right-auto top-12 sm:top-14"
              : "left-3 right-auto"
          }
        />
      ) : null}

      {images.length > 1 ? (
        <span
          className={`pointer-events-none absolute left-3 top-3 z-10 font-display text-[10px] font-bold uppercase tracking-aggressive ${
            theme === "dark" ? "text-paper" : "text-ink"
          }`}
        >
          {String(resolvedIndex + 1).padStart(2, "0")}
          <span className={theme === "dark" ? "text-paper/35" : "text-ink/40"}>
            {" "}
            / {String(images.length).padStart(2, "0")}
          </span>
        </span>
      ) : null}

      {images.length > 1 ? (
        <nav
          aria-label="Gallery navigation"
          className="mt-3 flex items-center justify-between"
        >
          <CarouselArrow
            direction="prev"
            label="Previous image"
            onClick={showPrevious}
            theme={theme}
          />
          <CarouselArrow
            direction="next"
            label="Next image"
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
            {images.length > 1 || showGalleryVideo ? (
              <div className="hidden w-24 shrink-0 flex-col gap-3 lg:flex">
                {images.length > 1 ? thumbList("vertical") : null}
                {galleryVideoTrigger("column")}
              </div>
            ) : null}
          </>
        ) : (
          <>
            {images.length > 1 ? (
              <div className="hidden w-24 shrink-0 lg:flex">
                {thumbList("vertical")}
              </div>
            ) : null}
            {mainStage}
          </>
        )}
      </div>

      {images.length > 1 || (isHero && showGalleryVideo) ? (
        <div className="flex flex-col gap-3 lg:hidden">
          {images.length > 1 ? thumbList("horizontal") : null}
          {isHero ? galleryVideoTrigger("row") : null}
        </div>
      ) : null}

      <ProductImageLightbox
        images={images}
        alt={alt}
        initialIndex={resolvedIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        variant={variant}
      />

      {showGalleryVideo && vimeoId ? (
        <ProductVideoModal
          vimeoId={vimeoId}
          title={videoTitle ?? `Watch ${alt}`}
          open={videoOpen}
          onClose={() => setVideoOpen(false)}
        />
      ) : null}
    </div>
  );
}
