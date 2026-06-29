"use client";

import { cn } from "@/lib/utils";

export type MorphLoadingProps = {
  variant?: "morph";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const containerSizes = {
  sm: "size-16",
  md: "size-24",
  lg: "size-32",
} as const;

export function MorphLoading({
  variant = "morph",
  size = "md",
  className,
}: MorphLoadingProps) {
  if (variant === "morph") {
    return (
      <div
        className={cn("relative", containerSizes[size], className)}
        role="status"
        aria-label="Loading"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="absolute size-3 bg-accent sm:size-4"
              style={{
                animation: `morph-${index} 2s infinite ease-in-out`,
                animationDelay: `${index * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export default MorphLoading;
