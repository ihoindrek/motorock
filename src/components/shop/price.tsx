import { formatPrice } from "@/lib/shop/category";
import { cn } from "@/lib/utils";

const variantClasses = {
  sm: "text-sm",
  md: "text-base sm:text-lg",
  lg: "text-lg sm:text-xl",
  xl: "text-2xl sm:text-3xl",
} as const;

type PriceProps = {
  value: number;
  variant?: keyof typeof variantClasses;
  className?: string;
  as?: "span" | "p" | "dd";
  locale?: "en" | "et";
};

export function Price({
  value,
  variant = "md",
  className,
  as: Component = "span",
  locale = "et",
}: PriceProps) {
  return (
    <Component
      className={cn(
        "font-body font-extrabold tabular-nums tracking-normal text-ink",
        variantClasses[variant],
        className,
      )}
    >
      {formatPrice(value, locale)}
    </Component>
  );
}
