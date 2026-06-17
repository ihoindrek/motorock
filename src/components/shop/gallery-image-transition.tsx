"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function useGallerySlideDirection(activeIndex: number, total: number) {
  const previousIndex = useRef(activeIndex);
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    const previous = previousIndex.current;

    if (activeIndex === previous || total <= 1) {
      previousIndex.current = activeIndex;
      return;
    }

    const movedForward =
      activeIndex > previous ||
      (previous === total - 1 && activeIndex === 0);
    const movedBackward =
      activeIndex < previous || (previous === 0 && activeIndex === total - 1);

    if (movedForward && !movedBackward) {
      setDirection(1);
    } else if (movedBackward && !movedForward) {
      setDirection(-1);
    }

    previousIndex.current = activeIndex;
  }, [activeIndex, total]);

  return direction;
}

type GalleryImageTransitionProps = {
  imageKey: string;
  direction: 1 | -1;
  className?: string;
  children: ReactNode;
};

export function GalleryImageTransition({
  imageKey,
  direction,
  className = "",
  children,
}: GalleryImageTransitionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={imageKey}
          custom={direction}
          variants={{
            enter: (slideDirection: 1 | -1) =>
              reduceMotion
                ? { opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }
                : {
                    opacity: 0,
                    scale: 1.035,
                    x: slideDirection * 28,
                    filter: "blur(6px)",
                  },
            center: {
              opacity: 1,
              scale: 1,
              x: 0,
              filter: "blur(0px)",
            },
            exit: (slideDirection: 1 | -1) =>
              reduceMotion
                ? { opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }
                : {
                    opacity: 0,
                    scale: 0.985,
                    x: slideDirection * -20,
                    filter: "blur(4px)",
                  },
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: reduceMotion ? 0 : 0.42,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute inset-0"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
