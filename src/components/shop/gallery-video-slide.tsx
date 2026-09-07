"use client";

import Image from "next/image";
import {
  buildProductVideoEmbedUrl,
  type ProductVideo,
} from "@/lib/shop/parse-product-video";
import { cn } from "@/lib/utils";

export const GALLERY_VIDEO_THUMB_KEY = "__gallery_video__";

export function isGalleryVideoThumbKey(value: string) {
  return value === GALLERY_VIDEO_THUMB_KEY;
}

type GalleryVideoThumbButtonProps = {
  posterSrc: string;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
  imageBackground?: "surface" | "moto" | "detail" | "white";
  style?: "craft" | "default";
  theme?: "dark" | "light";
  compact?: boolean;
  fillRail?: boolean;
};

function PlayIcon({ className = "size-3.5" }: { className?: string }) {
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

export function GalleryVideoThumbButton({
  posterSrc,
  index,
  total,
  selected,
  onSelect,
  imageBackground = "surface",
  style = "default",
  theme = "light",
  compact = false,
  fillRail = false,
}: GalleryVideoThumbButtonProps) {
  const imageBgClass =
    imageBackground === "moto"
      ? "bg-moto"
      : imageBackground === "detail"
        ? "bg-detail"
        : imageBackground === "white"
          ? "bg-white"
          : "bg-surface";

  if (style === "craft") {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-label={`View product video (${index + 1} of ${total})`}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "relative aspect-square w-full p-[2px] transition-all duration-200",
          selected
            ? "bg-gradient-to-br from-[#FF5A00] via-[#ff7e26] to-[#ff9c59] opacity-100"
            : "bg-ink/15 opacity-60 hover:bg-ink/30 hover:opacity-100",
        )}
      >
        <span className={cn("relative block size-full overflow-hidden", imageBgClass)}>
          <Image
            src={posterSrc}
            alt=""
            fill
            sizes="96px"
            className="object-contain object-top p-0.5 sm:p-1"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-ink/25">
            <span className="flex size-7 items-center justify-center rounded-full bg-ink/85 text-paper sm:size-8">
              <PlayIcon />
            </span>
          </span>
        </span>
      </button>
    );
  }

  const sizeClass = compact
    ? "h-14 w-[4.25rem]"
    : fillRail
      ? "h-[4.5rem] w-full sm:h-20"
      : "h-[4.5rem] w-[5.5rem] sm:h-20 sm:w-24";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`View product video (${index + 1} of ${total})`}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "group/thumb relative block overflow-hidden transition-all duration-300 ease-out",
        sizeClass,
        selected
          ? "scale-100 border-2 border-accent opacity-100"
          : "scale-[0.96] border border-ink/25 opacity-45 hover:scale-[0.98] hover:border-ink/40 hover:opacity-90",
        theme === "light" ? "bg-white" : "bg-moto",
      )}
    >
      <Image
        src={posterSrc}
        alt=""
        fill
        sizes="96px"
        className="object-contain object-center p-1.5 mix-blend-multiply"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-ink/20">
        <span className="flex size-7 items-center justify-center rounded-full bg-ink/85 text-paper">
          <PlayIcon />
        </span>
      </span>
      <span
        className={cn(
          "absolute inset-x-0 bottom-0 h-0.5 origin-left bg-accent transition-transform duration-300",
          selected ? "scale-x-100" : "scale-x-0",
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          "pointer-events-none absolute left-1 top-1 font-body text-[8px] font-bold tabular-nums tracking-widest",
          theme === "dark" ? "text-paper/50" : "text-ink/40",
          selected && "text-accent",
        )}
        aria-hidden="true"
      >
        {String(index + 1).padStart(2, "0")}
      </span>
    </button>
  );
}

type GalleryInlineVideoStageProps = {
  video: ProductVideo;
  title: string;
  posterSrc?: string;
  onExpand: () => void;
  expandLabel: string;
  className?: string;
  imageBackground?: "surface" | "moto" | "detail" | "white";
};

export function GalleryInlineVideoStage({
  video,
  title,
  posterSrc,
  onExpand,
  expandLabel,
  className = "",
  imageBackground = "white",
}: GalleryInlineVideoStageProps) {
  const imageBgClass =
    imageBackground === "moto"
      ? "bg-moto"
      : imageBackground === "detail"
        ? "bg-detail"
        : imageBackground === "white"
          ? "bg-white"
          : "bg-surface";

  return (
    <figure
      className={cn(
        "relative w-full overflow-hidden max-lg:leading-none",
        imageBgClass,
        className,
      )}
    >
      <div className="relative mx-auto aspect-[4/5] w-full max-h-[min(72vh,44rem)] sm:aspect-video">
        {video.provider === "file" ? (
          <video
            src={buildProductVideoEmbedUrl(video)}
            title={title}
            controls
            playsInline
            preload="metadata"
            poster={posterSrc}
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : (
          <iframe
            src={buildProductVideoEmbedUrl(video)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        )}
      </div>
      <button
        type="button"
        onClick={onExpand}
        aria-label={expandLabel}
        className="absolute right-3 top-3 z-20 inline-flex size-9 items-center justify-center rounded-full border border-ink/10 bg-paper/92 text-ink shadow-sm backdrop-blur-sm transition hover:border-ink/20 sm:right-4 sm:top-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="size-4"
          aria-hidden="true"
        >
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      </button>
    </figure>
  );
}
