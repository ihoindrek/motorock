"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { StarRating } from "@/components/ui/star-rating";
import { cn } from "@/lib/utils";

export type DesignTestimonialItem = {
  id: string | number;
  quote: string;
  author: string;
  role: string;
  company?: string;
  rating?: number;
  avatar?: string;
};

type DesignTestimonialProps = {
  items: readonly DesignTestimonialItem[];
  verticalLabel?: string;
  className?: string;
  compactMobile?: boolean;
};

const AUTOPLAY_MS = 6000;

export function DesignTestimonial({
  items,
  verticalLabel = "Reviews",
  className,
  compactMobile = false,
}: DesignTestimonialProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<number | null>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const numberX = useTransform(x, [-200, 200], [-20, 20]);
  const numberY = useTransform(y, [-200, 200], [-10, 10]);

  const goToIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) {
        return;
      }

      setActiveIndex(index);
    },
    [items.length],
  );

  const goNext = useCallback(
    () => setActiveIndex((prev) => (prev + 1) % items.length),
    [items.length],
  );

  const goPrev = useCallback(
    () => setActiveIndex((prev) => (prev - 1 + items.length) % items.length),
    [items.length],
  );

  const resetAutoplay = useCallback(() => {
    if (autoplayRef.current != null) {
      window.clearInterval(autoplayRef.current);
    }

    if (items.length <= 1) {
      return;
    }

    autoplayRef.current = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, AUTOPLAY_MS);
  }, [items.length]);

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (autoplayRef.current != null) {
        window.clearInterval(autoplayRef.current);
      }
    };
  }, [resetAutoplay]);

  const handleSelect = (index: number) => {
    if (index === activeIndex) {
      return;
    }

    goToIndex(index);
    resetAutoplay();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  if (items.length === 0) {
    return null;
  }

  const current = items[activeIndex];

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden", className)}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -left-4 top-1/2 hidden -translate-y-1/2 select-none font-display text-[12rem] font-extrabold leading-none tracking-tighter text-ink/[0.04] sm:-left-8 sm:text-[20rem] lg:block lg:text-[28rem]"
        style={{ x: numberX, y: numberY }}
        aria-hidden="true"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="block"
          >
            {String(activeIndex + 1).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      <div className="relative flex flex-col lg:flex-row">
        <div
          className={cn(
            "flex flex-row items-center gap-6 border-b border-ink/10 pb-6 lg:flex-col lg:items-center lg:justify-center lg:border-b-0 lg:border-r lg:pb-0 lg:pr-12",
            compactMobile && "hidden lg:flex",
          )}
        >
          <motion.span
            className="font-body text-[10px] font-bold uppercase tracking-[0.25em] text-ink/40 lg:[writing-mode:vertical-rl]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {verticalLabel}
          </motion.span>

          <div className="relative h-px flex-1 bg-ink/10 lg:hidden">
            <motion.div
              className="absolute left-0 top-0 h-full origin-left bg-ink"
              animate={{
                width: `${((activeIndex + 1) / items.length) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <div className="relative hidden h-32 w-px bg-ink/10 lg:block">
            <motion.div
              className="absolute left-0 top-0 w-full origin-top bg-ink"
              animate={{
                height: `${((activeIndex + 1) / items.length) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        <div
          className={cn(
            "flex-1 lg:py-10 lg:pl-12",
            compactMobile ? "py-0" : "py-8",
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="mb-6 flex flex-wrap items-center gap-3"
            >
              {current.company ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 px-3 py-1 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/50">
                  <span className="size-1.5 rounded-full bg-accent" />
                  {current.company}
                </span>
              ) : null}
              {current.rating != null ? (
                <StarRating rating={current.rating} size="sm" />
              ) : null}
            </motion.div>
          </AnimatePresence>

          <div
            className={cn(
              "relative mb-10",
              compactMobile
                ? "mb-5 min-h-0 lg:mb-10 lg:min-h-[140px]"
                : "min-h-[120px] sm:min-h-[140px]",
            )}
          >
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={activeIndex}
                className={cn(
                  "font-body font-light leading-[1.2] tracking-tight text-ink",
                  compactMobile
                    ? "text-lg sm:text-2xl lg:text-4xl"
                    : "text-2xl sm:text-3xl lg:text-4xl",
                )}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {current.quote.split(" ").map((word, index) => (
                  <motion.span
                    key={`${activeIndex}-${index}`}
                    className="mr-[0.3em] inline-block"
                    variants={{
                      hidden: { opacity: 0, y: 20, rotateX: 90 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        rotateX: 0,
                        transition: {
                          duration: 0.5,
                          delay: index * 0.04,
                          ease: [0.22, 1, 0.36, 1],
                        },
                      },
                      exit: {
                        opacity: 0,
                        y: -10,
                        transition: { duration: 0.2, delay: index * 0.02 },
                      },
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.blockquote>
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex items-center gap-4"
              >
                <AuthorAvatar item={current} size="md" />
                <div>
                  <p className="font-body text-base font-semibold text-ink">
                    {current.author}
                  </p>
                  <p className="text-sm text-ink/50">{current.role}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {items.length > 1 ? (
              <div className="flex items-center gap-3">
                <NavButton
                  direction="prev"
                  onClick={() => {
                    goPrev();
                    resetAutoplay();
                  }}
                />
                <NavButton
                  direction="next"
                  onClick={() => {
                    goNext();
                    resetAutoplay();
                  }}
                />
              </div>
            ) : null}
          </div>

          {items.length > 1 ? (
            <div
              className={cn(
                "mt-10 flex flex-wrap items-center justify-center gap-2 sm:justify-start",
                compactMobile && "mt-6 lg:mt-10",
              )}
            >
              {items.map((item, index) => {
                const isActive = activeIndex === index;
                const isHovered = hoveredIndex === index && !isActive;
                const showName = isActive || isHovered;

                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={isActive}
                    aria-label={item.author}
                    onClick={() => handleSelect(index)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={cn(
                      "relative flex cursor-pointer items-center gap-0 rounded-full",
                      "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                      isActive
                        ? "bg-ink shadow-lg"
                        : "bg-transparent hover:bg-surface",
                      showName ? "py-2 pl-2 pr-4" : "p-0.5",
                    )}
                  >
                    <AuthorAvatar item={item} size="sm" active={isActive} />

                    <div
                      className={cn(
                        "grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        showName
                          ? "ml-2 grid-cols-[1fr] opacity-100"
                          : "ml-0 grid-cols-[0fr] opacity-0",
                      )}
                    >
                      <div className="overflow-hidden">
                        <span
                          className={cn(
                            "block whitespace-nowrap text-sm font-medium transition-colors duration-300",
                            isActive ? "text-paper" : "text-ink",
                          )}
                        >
                          {item.author}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "pointer-events-none absolute -bottom-12 left-0 right-0 overflow-hidden opacity-[0.06]",
          compactMobile && "hidden lg:block",
        )}
      >
        <motion.div
          className="flex whitespace-nowrap font-display text-4xl font-extrabold uppercase tracking-tight text-ink sm:text-6xl"
          animate={{ x: [0, -1000] }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          {[...Array(6)].map((_, index) => (
            <span key={index} className="mx-8">
              {items.map((item) => item.author).join(" • ")} •
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function AuthorAvatar({
  item,
  size,
  active = false,
}: {
  item: Pick<DesignTestimonialItem, "author" | "avatar">;
  size: "sm" | "md";
  active?: boolean;
}) {
  const dimension = size === "md" ? "size-12" : "size-8";

  if (item.avatar) {
    return (
      <img
        src={item.avatar}
        alt=""
        className={cn(
          dimension,
          "shrink-0 rounded-full object-cover transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          active ? "ring-2 ring-paper/30" : "ring-0",
          !active && size === "sm" && "hover:scale-105",
        )}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-ink/10 font-body font-bold text-ink/50",
        dimension,
        size === "sm" ? "text-xs" : "text-sm",
        active ? "ring-2 ring-paper/30" : "ring-0",
      )}
    >
      {item.author.slice(0, 1)}
    </div>
  );
}

function NavButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous review" : "Next review"}
      className="group flex size-12 items-center justify-center rounded-full border border-ink/15 transition-colors duration-300 hover:border-ink hover:bg-ink"
      whileTap={{ scale: 0.95 }}
    >
      <Icon
        className="size-[18px] text-ink transition-colors duration-300 group-hover:text-paper"
        strokeWidth={1.5}
      />
    </motion.button>
  );
}
