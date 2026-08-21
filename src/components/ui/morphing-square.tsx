"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { type HTMLMotionProps, motion } from "motion/react";

import { cn } from "@/lib/utils";

const morphingSquareVariants = cva("flex items-center justify-center gap-3", {
  variants: {
    messagePlacement: {
      bottom: "flex-col",
      top: "flex-col-reverse",
      right: "flex-row",
      left: "flex-row-reverse",
    },
    size: {
      sm: "",
      md: "",
      lg: "",
    },
  },
  defaultVariants: {
    messagePlacement: "bottom",
    size: "md",
  },
});

const squareSizeClasses = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
} as const;

export interface MorphingSquareProps
  extends VariantProps<typeof morphingSquareVariants> {
  message?: string;
  /**
   * Position of the message relative to the spinner.
   * @default bottom
   */
  messagePlacement?: "top" | "bottom" | "left" | "right";
}

export function MorphingSquare({
  className,
  message,
  messagePlacement = "bottom",
  size = "md",
  ...props
}: HTMLMotionProps<"div"> & MorphingSquareProps) {
  return (
    <div
      className={cn(morphingSquareVariants({ messagePlacement, size }))}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message ?? "Loading"}
    >
      <motion.div
        className={cn("bg-accent", squareSizeClasses[size ?? "md"], className)}
        animate={{
          borderRadius: ["6%", "50%", "6%"],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        {...props}
      />
      {message ? (
        <p className="max-w-xs text-center text-xs font-medium text-ink/50">
          {message}
        </p>
      ) : null}
    </div>
  );
}
