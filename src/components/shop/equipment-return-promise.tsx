import { EQUIPMENT_RETURN_PROMISE } from "@/data/return-policy";
import { cn } from "@/lib/utils";

type EquipmentReturnPromiseProps = {
  variant?: "product" | "banner" | "compact";
  className?: string;
};

export function EquipmentReturnPromise({
  variant = "product",
  className,
}: EquipmentReturnPromiseProps) {
  if (variant === "compact") {
    return (
      <p className={cn("text-xs text-ink/60", className)}>
        {EQUIPMENT_RETURN_PROMISE.headline}
      </p>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "border border-accent/15 bg-accent/[0.04] px-3 py-3 sm:px-4",
          className,
        )}
      >
        <p className="text-sm font-semibold leading-snug text-ink">
          {EQUIPMENT_RETURN_PROMISE.headline}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-ink/55">
          {EQUIPMENT_RETURN_PROMISE.detail}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("border-l border-accent/60 pl-3", className)}>
      <p className="text-sm font-semibold leading-snug text-ink">
        {EQUIPMENT_RETURN_PROMISE.headline}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink/55">
        {EQUIPMENT_RETURN_PROMISE.detail}
      </p>
    </div>
  );
}
