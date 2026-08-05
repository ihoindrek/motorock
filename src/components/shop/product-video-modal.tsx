"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useDictionary } from "@/context/locale-context";
import {
  buildProductVideoEmbedUrl,
  type ProductVideo,
} from "@/lib/shop/parse-product-video";
import { StarButton } from "@/components/ui/star-button";
import { cn } from "@/lib/utils";

type ProductVideoModalProps = {
  video: ProductVideo;
  title: string;
  open: boolean;
  onClose: () => void;
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
      className="size-5"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function PlayIcon({ className = "size-6 translate-x-0.5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 5.14v13.72a1 1 0 0 0 1.55.84l11.26-6.86a1 1 0 0 0 0-1.68L9.55 4.3A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

export function GalleryVideoPlayButton({
  onClick,
  theme = "light",
  layout = "row",
  variant = "default",
  className = "",
}: {
  onClick: () => void;
  theme?: "dark" | "light";
  layout?: "row" | "column";
  variant?: "default" | "overlay";
  className?: string;
}) {
  const dict = useDictionary();
  const isDark = theme === "dark";
  const isColumn = layout === "column";
  const label = dict.motorcycle.watchVideo;

  if (variant === "overlay") {
    return (
      <StarButton
        type="button"
        onClick={onClick}
        aria-label={label}
        lightColor="#FF6813"
        backgroundColor="#FAF8F6"
        borderWidth={1.5}
        duration={2.75}
        lightWidth={72}
        className={cn(
          "h-auto rounded-full bg-paper/92 px-2.5 py-1.5 font-body text-[9px] font-bold uppercase tracking-aggressive text-ink shadow-[0_8px_24px_-16px_rgba(11,11,11,0.28)] backdrop-blur-sm transition-transform motion-safe:active:scale-[0.98] sm:gap-2.5 sm:px-3 sm:py-2 sm:text-[10px]",
          className,
        )}
        contentClassName="gap-2 text-ink sm:gap-2.5"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-paper sm:size-8">
          <PlayIcon className="size-3 translate-x-px sm:size-3.5" />
        </span>
        <span className="pr-0.5">{label}</span>
      </StarButton>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`group transition-opacity hover:opacity-90 ${
        isColumn
          ? "flex w-full flex-col items-center gap-2 pt-1"
          : "inline-flex items-center gap-3"
      } ${className}`}
    >
      <span
        className={`relative flex shrink-0 items-center justify-center ${
          isColumn ? "size-12" : "size-11"
        }`}
      >
        <span
          className={`absolute inset-0 rounded-full animate-gallery-play-ping ${
            isDark ? "bg-paper/25" : "bg-ink/15"
          }`}
          aria-hidden="true"
        />
        <span
          className={`absolute inset-0 rounded-full animate-gallery-play-ping [animation-delay:0.75s] ${
            isDark ? "bg-paper/15" : "bg-ink/10"
          }`}
          aria-hidden="true"
        />
        <span
          className={`gallery-play-glow relative flex size-full items-center justify-center rounded-full border transition-transform duration-300 group-hover:scale-105 group-active:scale-95 ${
            isDark
              ? "border-paper/20 bg-ink/85 text-paper"
              : "border-ink/10 bg-ink text-paper"
          }`}
        >
          <PlayIcon className="size-4 translate-x-px" />
        </span>
      </span>
      <span
        className={`font-body font-bold uppercase tracking-aggressive ${
          isColumn
            ? "max-w-[5.5rem] text-center text-[9px] leading-tight"
            : "text-[10px]"
        } ${isDark ? "text-paper/75" : "text-ink/65"}`}
      >
        {label}
      </span>
    </button>
  );
}

export function ProductVideoModal({
  video,
  title,
  open,
  onClose,
}: ProductVideoModalProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close video"
        className="fixed inset-0 z-[120] bg-ink/80 backdrop-blur-sm animate-fade-up"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-x-4 top-1/2 z-[121] mx-auto w-full max-w-5xl animate-gallery-video-in"
      >
        <div className="overflow-hidden bg-ink shadow-2xl">
          <div className="flex items-center justify-between gap-4 border-b border-paper/10 px-4 py-3 sm:px-5">
            <p
              id={titleId}
              className="font-body text-[10px] font-bold uppercase tracking-aggressive text-paper/55"
            >
              {title}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-10 items-center justify-center text-paper/70 transition-colors hover:text-accent"
              aria-label="Close video"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="relative aspect-video w-full bg-ink">
            <iframe
              src={buildProductVideoEmbedUrl(video)}
              title={title}
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
