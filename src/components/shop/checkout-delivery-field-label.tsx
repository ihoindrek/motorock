import type { ReactNode } from "react";
import type { DeliveryChecklistId } from "@/lib/checkout/delivery-validation";
import { cn } from "@/lib/utils";

const labelClassName =
  "font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/50";

export function isDeliveryChecklistComplete(
  checklist: readonly { id: DeliveryChecklistId; complete: boolean }[],
  id: DeliveryChecklistId,
) {
  return checklist.find((item) => item.id === id)?.complete ?? false;
}

export function DeliveryFieldLabel({
  complete,
  children,
  className,
}: {
  complete?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn(labelClassName, "inline-flex items-center gap-1.5", className)}>
      {children}
      {complete ? (
        <span
          aria-hidden="true"
          className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-stock/40 bg-stock/10 text-[10px] font-bold leading-none text-stock"
        >
          ✓
        </span>
      ) : null}
    </span>
  );
}
