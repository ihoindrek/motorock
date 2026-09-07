"use client";

import Image from "next/image";
import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  buildProductVideoEmbedUrl,
  type ProductVideo,
} from "@/lib/shop/parse-product-video";
import { cn } from "@/lib/utils";

export const GALLERY_VIDEO_THUMB_KEY = "__gallery_video__";

/** Shared main stage for craft equipment gallery — image + video use the same box. */
export const CRAFT_GALLERY_MAIN_STAGE_CLASS =
  "relative mx-auto w-full aspect-[4/5] max-h-[min(72vh,44rem)] overflow-hidden";

/** Fill the gray craft stage edge-to-edge; multiply drops white JPEG backgrounds into the stage. */
export const CRAFT_GALLERY_MEDIA_CLASS =
  "object-cover object-center mix-blend-multiply";

export function isGalleryVideoThumbKey(value: string) {
  return value === GALLERY_VIDEO_THUMB_KEY;
}

export type GallerySlide =
  | { kind: "image"; src: string }
  | { kind: "video" };

export function buildGallerySlides(
  images: readonly string[],
  includeVideo: boolean,
): GallerySlide[] {
  if (!includeVideo || images.length === 0) {
    return images.map((src) => ({ kind: "image", src }));
  }

  return [
    { kind: "image" as const, src: images[0] },
    { kind: "video" as const },
    ...images.slice(1).map((src) => ({ kind: "image" as const, src })),
  ];
}

export function gallerySlideRailKey(slide: GallerySlide) {
  return slide.kind === "video" ? GALLERY_VIDEO_THUMB_KEY : slide.src;
}

export function imageIndexToSlideIndex(
  imageIndex: number,
  slides: readonly GallerySlide[],
) {
  if (imageIndex < 0) {
    return -1;
  }

  let seenImages = 0;
  for (let index = 0; index < slides.length; index++) {
    if (slides[index]?.kind !== "image") {
      continue;
    }

    if (seenImages === imageIndex) {
      return index;
    }

    seenImages++;
  }

  return 0;
}

export function slideIndexToLightboxImageIndex(
  slideIndex: number,
  slides: readonly GallerySlide[],
) {
  let imageIndex = 0;

  for (let index = 0; index < slideIndex; index++) {
    if (slides[index]?.kind === "image") {
      imageIndex++;
    }
  }

  if (slides[slideIndex]?.kind === "video") {
    return Math.max(0, imageIndex - 1);
  }

  return imageIndex;
}

type GalleryVideoThumbButtonProps = {
  posterSrc: string;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
  onOpenLightbox?: () => void;
  imageBackground?: "surface" | "moto" | "detail" | "white";
  style?: "craft" | "default";
  theme?: "dark" | "light";
  compact?: boolean;
  fillRail?: boolean;
};

function PauseIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
    </svg>
  );
}

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
  onOpenLightbox,
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
        onDoubleClick={onOpenLightbox}
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
            className={CRAFT_GALLERY_MEDIA_CLASS}
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
      onDoubleClick={onOpenLightbox}
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
  /** content = match portrait product image; fill = inherit parent gallery stage height */
  stageLayout?: "content" | "fill";
};

function inlineVideoStageContainerClass(stageLayout: "content" | "fill") {
  if (stageLayout === "fill") {
    return "relative h-full w-full min-h-0 overflow-hidden";
  }

  return cn(CRAFT_GALLERY_MAIN_STAGE_CLASS, "overflow-hidden");
}

function inlineVideoMediaClass(stageLayout: "content" | "fill") {
  return cn(
    "absolute inset-0 h-full w-full object-cover",
    stageLayout === "content" ? "object-top" : "object-center",
  );
}

function inlineVideoIframeClass() {
  return "absolute left-1/2 top-1/2 aspect-video h-full w-auto min-w-full -translate-x-1/2 -translate-y-1/2";
}

export type GalleryInlineVideoStageHandle = {
  play: () => Promise<void>;
};

export const GalleryInlineVideoStage = forwardRef<
  GalleryInlineVideoStageHandle,
  GalleryInlineVideoStageProps
>(function GalleryInlineVideoStage(
  {
    video,
    title,
    posterSrc,
    onExpand,
    expandLabel,
    className = "",
    imageBackground = "white",
    stageLayout = "content",
  },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useLayoutEffect(() => {
    if (video.provider !== "file") {
      return;
    }

    const element = videoRef.current;
    if (!element) {
      return;
    }

    void element
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));

    return () => {
      element.pause();
    };
  }, [video]);

  const imageBgClass =
    imageBackground === "moto"
      ? "bg-moto"
      : imageBackground === "detail"
        ? "bg-detail"
        : imageBackground === "white"
          ? "bg-white"
          : "bg-surface";

  const togglePlayback = async () => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    if (element.paused) {
      try {
        await element.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
      return;
    }

    element.pause();
    setPlaying(false);
  };

  useImperativeHandle(ref, () => ({
    play: async () => {
      if (video.provider !== "file") {
        return;
      }

      const element = videoRef.current;
      if (!element) {
        return;
      }

      try {
        await element.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    },
  }));

  return (
    <figure
      className={cn(
        "group max-lg:leading-none",
        stageLayout === "content"
          ? cn(CRAFT_GALLERY_MAIN_STAGE_CLASS, imageBgClass)
          : cn(
              "relative w-full overflow-hidden",
              stageLayout === "fill" && "h-full",
              imageBgClass,
            ),
        className,
      )}
    >
      <div
        className={
          stageLayout === "content"
            ? "relative h-full w-full"
            : inlineVideoStageContainerClass(stageLayout)
        }
      >
        {video.provider === "file" ? (
          <>
            <video
              ref={videoRef}
              src={buildProductVideoEmbedUrl(video)}
              title={title}
              autoPlay
              playsInline
              preload="metadata"
              poster={posterSrc}
              className={inlineVideoMediaClass(stageLayout)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />
            <button
              type="button"
              onClick={togglePlayback}
              aria-label={playing ? "Pause video" : expandLabel}
              className="absolute inset-0 z-10 flex items-center justify-center bg-ink/0 opacity-0 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-ink/80 text-paper shadow-lg transition-transform duration-200 group-hover:scale-105 sm:size-16">
                {playing ? (
                  <PauseIcon className="size-6 sm:size-7" />
                ) : (
                  <PlayIcon className="size-6 translate-x-0.5 sm:size-7" />
                )}
              </span>
            </button>
          </>
        ) : (
          <iframe
            src={buildProductVideoEmbedUrl(video)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className={inlineVideoIframeClass()}
          />
        )}
      </div>
      <button
        type="button"
        onClick={onExpand}
        aria-label={expandLabel}
        className="absolute right-3 top-3 z-20 inline-flex size-9 items-center justify-center rounded-full border border-ink/10 bg-paper/92 text-ink opacity-0 shadow-sm backdrop-blur-sm transition hover:border-ink/20 group-hover:opacity-100 focus-visible:opacity-100 sm:right-4 sm:top-4"
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
});

type GalleryLightboxVideoStageProps = {
  video: ProductVideo;
  title: string;
  posterSrc?: string;
  playLabel: string;
  isProduct?: boolean;
};

export function GalleryLightboxVideoStage({
  video,
  title,
  posterSrc,
  playLabel,
  isProduct = true,
}: GalleryLightboxVideoStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useLayoutEffect(() => {
    if (video.provider !== "file") {
      return;
    }

    const element = videoRef.current;
    if (!element) {
      return;
    }

    void element
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));

    return () => {
      element.pause();
    };
  }, [video]);

  const togglePlayback = async () => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    if (element.paused) {
      try {
        await element.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
      return;
    }

    element.pause();
    setPlaying(false);
  };

  return (
    <div
      className={cn(
        "group relative size-full overflow-hidden",
        isProduct ? "bg-moto" : "bg-white",
      )}
    >
      {video.provider === "file" ? (
        <>
          <video
            ref={videoRef}
            src={buildProductVideoEmbedUrl(video)}
            title={title}
            autoPlay
            playsInline
            preload="metadata"
            poster={posterSrc}
            className="absolute inset-0 size-full object-contain object-center p-[3%] sm:p-[5%]"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={playing ? "Pause video" : playLabel}
            className="absolute inset-0 z-10 flex items-center justify-center bg-ink/0 opacity-0 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-ink/80 text-paper shadow-lg transition-transform duration-200 group-hover:scale-105 sm:size-20">
              {playing ? (
                <PauseIcon className="size-7 sm:size-8" />
              ) : (
                <PlayIcon className="size-7 translate-x-0.5 sm:size-8" />
              )}
            </span>
          </button>
        </>
      ) : (
        <iframe
          src={buildProductVideoEmbedUrl(video)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      )}
    </div>
  );
}
