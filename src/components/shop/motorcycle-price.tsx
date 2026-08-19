import type { ComponentProps } from "react";
import { MotorcycleSaleBadge } from "@/components/shop/motorcycle-sale-badge";
import { Price } from "@/components/shop/price";
import { formatPrice } from "@/lib/shop/category";
import { cn } from "@/lib/utils";

type MotorcyclePriceProps = {
  price: number;
  regularPrice?: number;
  variant?: ComponentProps<typeof Price>["variant"];
  className?: string;
  locale?: "en" | "et";
  inverted?: boolean;
  as?: ComponentProps<typeof Price>["as"];
  showDiscountBadge?: boolean;
};

export function MotorcyclePrice({
  price,
  regularPrice,
  variant = "md",
  className,
  locale = "et",
  inverted = false,
  as = "span",
  showDiscountBadge = false,
}: MotorcyclePriceProps) {
  const onSale =
    typeof regularPrice === "number" &&
    regularPrice > 0 &&
    price > 0 &&
    regularPrice > price;

  if (!onSale) {
    return (
      <Price
        value={price}
        variant={variant}
        className={className}
        locale={locale}
        as={as}
      />
    );
  }

  const regularVariant =
    variant === "xl" ? "md" : variant === "lg" ? "sm" : "sm";

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-x-2 gap-y-1",
        className,
      )}
    >
      <Price
        value={price}
        variant={variant}
        locale={locale}
        className={inverted ? "text-paper" : "text-accent"}
        as="span"
      />
      <span
        className={cn(
          "font-body font-semibold tabular-nums line-through decoration-current/35",
          regularVariant === "md" ? "text-base sm:text-lg" : "text-sm",
          inverted ? "text-paper/45" : "text-ink/45",
        )}
      >
        {formatPrice(regularPrice, locale)}
      </span>
      {showDiscountBadge ? (
        <MotorcycleSaleBadge
          price={price}
          regularPrice={regularPrice}
          variant="compact"
        />
      ) : null}
    </span>
  );
}
