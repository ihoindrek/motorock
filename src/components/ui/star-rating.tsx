import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  rating: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const starSizes = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
} as const;

export function StarRating({
  rating,
  size = "sm",
  className,
}: StarRatingProps) {
  const starClass = starSizes[size];

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${rating.toFixed(1)} / 5`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const filled = rating >= index + 1 - 0.25;

        return (
          <Star
            key={index}
            aria-hidden="true"
            className={cn(
              starClass,
              filled
                ? "fill-accent text-accent"
                : "fill-transparent text-ink/15",
            )}
            strokeWidth={filled ? 0 : 1.5}
          />
        );
      })}
    </div>
  );
}
