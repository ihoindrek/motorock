"use client";

import { MorphingSquare } from "@/components/ui/morphing-square";
import { cn } from "@/lib/utils";

export type MorphLoadingProps = {
  variant?: "morph";
  size?: "sm" | "md" | "lg";
  className?: string;
  message?: string;
};

export function MorphLoading({
  variant = "morph",
  size = "md",
  className,
  message,
}: MorphLoadingProps) {
  if (variant !== "morph") {
    return null;
  }

  return (
    <MorphingSquare
      size={size}
      message={message}
      className={cn(className)}
    />
  );
}

export default MorphLoading;
