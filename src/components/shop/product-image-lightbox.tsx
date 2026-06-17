"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  GalleryImageTransition,
  useGallerySlideDirection,
} from "@/components/shop/gallery-image-transition";
import { CarouselArrow } from "@/components/ui/carousel-arrow";

type ProductImageLightboxProps = {
  images: readonly string[];
  alt: string;
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  /** Product shots on grey vs lifestyle photos */
  variant?: "product" | "scene";
};

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      className="size-5 shrink-0 sm:size-6"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function LightboxThumbnail({
  src,
  index,
  total,
  selected,
  isProduct,
  onSelect,
  buttonRef,
}: {
  src: string;
  index: number;
  total: number;
  selected: boolean;
  isProduct: boolean;
  onSelect: () => void;
  buttonRef?: (node: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onSelect}
      aria-label={`View image ${index + 1} of ${total}`}
      aria-current={selected ? "true" : undefined}
      className={`group/thumb relative block h-[4.5rem] w-full shrink-0 overflow-hidden transition-all duration-300 ease-out sm:h-20 ${
        isProduct ? "bg-moto" : "bg-surface"
      } ${
        isProduct
          ? selected
            ? "scale-100 border-2 border-accent opacity-100"
            : "scale-[0.96] border border-ink/25 opacity-45 hover:scale-[0.98] hover:border-ink/40 hover:opacity-90"
          : selected
            ? "scale-100 opacity-100 ring-2 ring-accent ring-offset-2 ring-offset-white"
            : "scale-[0.96] opacity-45 hover:scale-[0.98] hover:opacity-90"
      }`}
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
        className={`pointer-events-none absolute left-1 top-1 font-display text-[8px] font-bold tabular-nums tracking-widest text-ink/40 ${
          selected ? "text-accent" : ""
        }`}
        aria-hidden="true"
      >
        {String(index + 1).padStart(2, "0")}
      </span>
    </button>
  );
}

export function ProductImageLightbox({
  images,
  alt,
  initialIndex = 0,
  open,
  onClose,
  variant = "product",
}: ProductImageLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);
  const mobileThumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const desktopThumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isProduct = variant === "product";
  const hasMultiple = images.length > 1;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setActiveIndex(initialIndex);
    }
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) {
      return;
    }

    mobileThumbRefs.current[activeIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
    desktopThumbRefs.current[activeIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [activeIndex, open]);

  const showPrevious = useCallback(() => {
    setActiveIndex((index) => (index > 0 ? index - 1 : images.length - 1));
  }, [images.length]);

  const showNext = useCallback(() => {
    setActiveIndex((index) => (index < images.length - 1 ? index + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft" && hasMultiple) {
        showPrevious();
      }

      if (event.key === "ArrowRight" && hasMultiple) {
        showNext();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, hasMultiple, onClose, showNext, showPrevious]);

  const slideDirection = useGallerySlideDirection(activeIndex, images.length);

  if (!open || images.length === 0 || !mounted) {
    return null;
  }

  const activeSrc = images[activeIndex] ?? images[0];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} — image ${activeIndex + 1} of ${images.length}`}
    >
      <button
        type="button"
        className="absolute inset-0 z-0"
        onClick={onClose}
        aria-label="Close gallery"
      />

      <div className="relative z-10 flex min-h-0 flex-1 basis-0 justify-center overflow-hidden p-3 sm:p-4 lg:p-6">
        <div
          className={`flex h-full min-h-0 w-full max-h-full self-stretch overflow-hidden ${
            hasMultiple
              ? "max-w-6xl flex-row items-stretch gap-2 lg:max-w-[min(88rem,calc(100%-3rem))] lg:gap-3"
              : "max-w-5xl flex-col"
          }`}
        >
          <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-end p-3 sm:p-4">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close gallery"
                className="pointer-events-auto inline-flex min-h-12 min-w-12 items-center justify-center gap-2.5 border border-ink/15 bg-white px-4 font-display text-xs font-bold uppercase tracking-aggressive text-ink shadow-[0_8px_24px_rgb(11_11_11_/_0.08)] transition-colors hover:border-accent hover:text-accent sm:min-h-14 sm:px-5"
              >
                <CloseIcon />
                <span>Close</span>
              </button>
            </div>

            <div className="relative min-h-0 flex-1 basis-0 overflow-hidden">
              <div className="absolute inset-0">
                <GalleryImageTransition
                  imageKey={activeSrc}
                  direction={slideDirection}
                  className="size-full"
                >
                  <div
                    className={`relative size-full ${isProduct ? "bg-moto" : "bg-white"}`}
                  >
                    <Image
                      src={activeSrc}
                      alt={`${alt} (${activeIndex + 1} of ${images.length})`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 70vw"
                      className={
                        isProduct
                          ? "object-contain object-center p-[3%] mix-blend-multiply sm:p-[5%]"
                          : "object-contain object-center"
                      }
                      priority
                    />
                  </div>
                </GalleryImageTransition>
              </div>

              {hasMultiple ? (
                <>
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden items-center p-2 sm:p-4 lg:flex">
                    <CarouselArrow
                      direction="prev"
                      label="Previous image"
                      onClick={showPrevious}
                      theme="light"
                      variant="icon"
                      className="pointer-events-auto"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden items-center p-2 sm:p-4 lg:flex">
                    <CarouselArrow
                      direction="next"
                      label="Next image"
                      onClick={showNext}
                      theme="light"
                      variant="icon"
                      className="pointer-events-auto"
                    />
                  </div>
                </>
              ) : null}
            </div>

            {hasMultiple ? (
              <nav
                aria-label="Gallery navigation"
                className="flex shrink-0 items-center justify-between border-t border-ink/10 bg-white px-4 py-3 sm:px-6 sm:py-4 lg:hidden"
              >
                <CarouselArrow
                  direction="prev"
                  label="Previous image"
                  onClick={showPrevious}
                  theme="light"
                />
                <CarouselArrow
                  direction="next"
                  label="Next image"
                  onClick={showNext}
                  theme="light"
                />
              </nav>
            ) : null}

            {hasMultiple ? (
              <div
                className="shrink-0 border-t border-ink/10 bg-white px-4 py-3 sm:px-6 lg:hidden"
                aria-label="Gallery thumbnails"
              >
                <div className="relative">
                  <div
                    className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent"
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent"
                    aria-hidden="true"
                  />
                  <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <ul className="flex w-max gap-2.5 px-1">
                    {images.map((src, index) => (
                      <li key={`${src}-${index}`} className="w-20 shrink-0">
                        <LightboxThumbnail
                          src={src}
                          index={index}
                          total={images.length}
                          selected={index === activeIndex}
                          isProduct={isProduct}
                          onSelect={() => setActiveIndex(index)}
                          buttonRef={(node) => {
                            mobileThumbRefs.current[index] = node;
                          }}
                        />
                      </li>
                    ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {hasMultiple ? (
            <aside className="hidden h-full min-h-0 w-24 shrink-0 flex-col py-3 lg:flex lg:py-4">
              <div
                className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                aria-label="Gallery thumbnails"
              >
                {images.map((src, index) => (
                  <LightboxThumbnail
                    key={`${src}-${index}`}
                    src={src}
                    index={index}
                    total={images.length}
                    selected={index === activeIndex}
                    isProduct={isProduct}
                    onSelect={() => setActiveIndex(index)}
                    buttonRef={(node) => {
                      desktopThumbRefs.current[index] = node;
                    }}
                  />
                ))}
              </div>
              <p className="mt-2 text-center font-display text-[10px] font-bold tabular-nums tracking-aggressive text-ink/70 lg:mt-3">
                {String(activeIndex + 1).padStart(2, "0")}
                <span className="text-ink/35">
                  {" "}
                  / {String(images.length).padStart(2, "0")}
                </span>
              </p>
            </aside>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

type OpenableImageTriggerProps = {
  children: ReactNode;
  onOpen: () => void;
  label?: string;
  className?: string;
  theme?: "dark" | "light";
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

export function OpenableImageTrigger({
  children,
  onOpen,
  label = "Open image full size",
  className = "",
  theme = "light",
  onSwipeLeft,
  onSwipeRight,
}: OpenableImageTriggerProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);

  const handleTouchStart = (event: React.TouchEvent<HTMLButtonElement>) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLButtonElement>) => {
    if (!touchStartRef.current) {
      return;
    }

    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const isHorizontalSwipe = Math.abs(dx) >= 44 && Math.abs(dy) <= 34;
    if (!isHorizontalSwipe) {
      return;
    }

    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);

    if (dx < 0) {
      onSwipeLeft?.();
      return;
    }

    onSwipeRight?.();
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      return;
    }

    onOpen();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label={label}
      className={`group/openable relative block w-full cursor-zoom-in text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      {children}
      <span
        className={`pointer-events-none absolute bottom-3 right-3 flex size-10 items-center justify-center border opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 group-hover/openable:opacity-100 group-focus-visible/openable:opacity-100 ${
          theme === "dark"
            ? "border-paper/20 bg-ink/70 text-paper"
            : "border-ink/10 bg-paper/90 text-ink"
        }`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
          <path
            d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="square"
          />
        </svg>
      </span>
    </button>
  );
}
