"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { cn } from "@/lib/utils";

type ParallaxImage = {
  src: string;
  alt?: string;
};

type ZoomParallaxProps = {
  images: ParallaxImage[];
  className?: string;
  stickyClassName?: string;
};

const POSITION_CLASSES = [
  "",
  "[&>div]:!-top-[30vh] [&>div]:!left-[5vw] [&>div]:!h-[30vh] [&>div]:!w-[35vw]",
  "[&>div]:!-top-[10vh] [&>div]:!-left-[25vw] [&>div]:!h-[45vh] [&>div]:!w-[20vw]",
  "[&>div]:!left-[27.5vw] [&>div]:!h-[25vh] [&>div]:!w-[25vw]",
  "[&>div]:!top-[27.5vh] [&>div]:!left-[5vw] [&>div]:!h-[25vh] [&>div]:!w-[20vw]",
  "[&>div]:!top-[27.5vh] [&>div]:!-left-[22.5vw] [&>div]:!h-[25vh] [&>div]:!w-[30vw]",
  "[&>div]:!top-[22.5vh] [&>div]:!left-[25vw] [&>div]:!h-[15vh] [&>div]:!w-[15vw]",
] as const;

export function ZoomParallax({
  images,
  className,
  stickyClassName = "sticky top-0 h-svh overflow-hidden bg-ink",
}: ZoomParallaxProps) {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  const scale4 = useTransform(scrollYProgress, [0, 1], [1, 4]);
  const scale5 = useTransform(scrollYProgress, [0, 1], [1, 5]);
  const scale6 = useTransform(scrollYProgress, [0, 1], [1, 6]);
  const scale8 = useTransform(scrollYProgress, [0, 1], [1, 8]);
  const scale9 = useTransform(scrollYProgress, [0, 1], [1, 9]);

  const scales = [scale4, scale5, scale6, scale5, scale6, scale8, scale9];

  if (images.length === 0) {
    return null;
  }

  return (
    <div
      ref={container}
      className={cn(
        "relative h-[220vh] sm:h-[280vh] lg:h-[300vh]",
        className ?? "bg-ink",
      )}
    >
      <div className={stickyClassName}>
        {images.slice(0, 7).map(({ src, alt }, index) => {
          const scale = scales[index % scales.length];

          return (
            <motion.div
              key={`${src}-${index}`}
              style={{ scale }}
              className={`absolute top-0 flex h-full w-full items-center justify-center ${POSITION_CLASSES[index] ?? ""}`}
            >
              <div className="relative h-[25vh] w-[25vw] min-w-[7rem]">
                <Image
                  src={src}
                  alt={alt ?? `Product image ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 40vw, 25vw"
                  className="object-cover"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
