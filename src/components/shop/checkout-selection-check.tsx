import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CheckoutSelectionCheck({
  selected,
  className,
  size = "md",
}: {
  selected: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  if (!selected) {
    return null;
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-accent text-white",
        size === "sm" ? "size-4" : "size-5",
        className,
      )}
      aria-hidden="true"
    >
      <Check
        className={cn(size === "sm" ? "size-2.5" : "size-3", "stroke-[3]")}
      />
    </span>
  );
}
