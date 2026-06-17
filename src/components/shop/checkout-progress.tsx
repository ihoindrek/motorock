import { cn } from "@/lib/utils";
import type { CheckoutStep } from "@/context/checkout-step-context";

const steps = [
  { id: 1, label: "Cart" },
  { id: 2, label: "Delivery" },
  { id: 3, label: "Pay" },
] as const;

export function CheckoutProgress({
  currentStep,
  variant = "page",
  inverted = false,
  className,
}: {
  currentStep: CheckoutStep;
  variant?: "page" | "header";
  inverted?: boolean;
  className?: string;
}) {
  const isHeader = variant === "header";

  return (
    <nav
      aria-label="Checkout progress"
      className={cn(
        isHeader ? "w-full max-w-xl" : "mb-8 w-full",
        className,
      )}
    >
      <ol
        className={cn(
          "flex w-full items-center",
          isHeader ? "gap-2" : "gap-2 sm:gap-4",
        )}
      >
        {steps.map((step, index) => {
          const done = step.id < currentStep;
          const active = step.id === currentStep;

          return (
            <li
              key={step.id}
              className="flex min-w-0 flex-1 items-center gap-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full border font-bold tabular-nums",
                    isHeader ? "size-6 text-[10px]" : "size-7 text-xs",
                    done && "border-accent bg-accent text-paper",
                    active &&
                      !done &&
                      (inverted
                        ? "border-accent text-accent"
                        : "border-accent text-accent"),
                    !done &&
                      !active &&
                      (inverted
                        ? "border-paper/20 text-paper/35"
                        : "border-ink/15 text-ink/35"),
                  )}
                  aria-hidden="true"
                >
                  {done ? "✓" : step.id}
                </span>
                <span
                  className={cn(
                    "truncate font-display font-bold uppercase tracking-aggressive",
                    isHeader ? "text-[10px]" : "text-[11px]",
                    active || done
                      ? inverted
                        ? "text-paper"
                        : "text-ink"
                      : inverted
                        ? "text-paper/35"
                        : "text-ink/35",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "hidden h-px flex-1 sm:block",
                    done
                      ? "bg-accent/50"
                      : inverted
                        ? "bg-paper/15"
                        : "bg-ink/10",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
