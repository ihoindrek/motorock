"use client";

import { useDictionary } from "@/context/locale-context";
import { cn } from "@/lib/utils";

type GiveawayHowItWorksProps = {
  variant?: "default" | "compact" | "on-dark";
  className?: string;
};

export function GiveawayHowItWorks({
  variant = "default",
  className,
}: GiveawayHowItWorksProps) {
  const dict = useDictionary();
  const steps = [
    dict.giveaway.howItWorksStep1,
    dict.giveaway.howItWorksStep2,
    dict.giveaway.howItWorksStep3,
  ];

  const isOnDark = variant === "on-dark";
  const isCompact = variant === "compact";

  return (
    <section
      aria-labelledby="giveaway-how-it-works-title"
      className={cn(
        isOnDark
          ? "rounded-sm border border-paper/15 bg-ink/35 p-4 backdrop-blur-sm sm:p-5"
          : isCompact
            ? "rounded-sm border border-accent/20 bg-accent/[0.06] p-4"
            : "rounded-sm border border-accent/25 bg-gradient-to-br from-accent/[0.08] via-paper to-paper p-5 sm:p-6",
        className,
      )}
    >
      <h2
        id="giveaway-how-it-works-title"
        className={cn(
          "font-body text-[10px] font-bold uppercase tracking-aggressive",
          isOnDark ? "text-accent" : "text-accent",
        )}
      >
        {dict.giveaway.howItWorksTitle}
      </h2>
      <p
        className={cn(
          "mt-2 font-body text-lg font-extrabold leading-snug sm:text-xl",
          isOnDark ? "text-paper" : "text-ink",
        )}
      >
        {dict.giveaway.entryHeadline}
      </p>
      <ol className="mt-3 space-y-2.5">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm leading-snug">
            <span
              className={cn(
                "inline-flex size-6 shrink-0 items-center justify-center rounded-full font-body text-[11px] font-extrabold tabular-nums",
                isOnDark
                  ? "bg-accent text-paper"
                  : "bg-accent text-paper",
              )}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <span
              className={cn(
                "pt-0.5",
                isOnDark ? "text-paper/90" : "text-ink/85",
              )}
            >
              {step}
            </span>
          </li>
        ))}
      </ol>
      <p
        className={cn(
          "mt-4 border-t pt-3 font-body text-xs leading-relaxed",
          isOnDark
            ? "border-paper/10 text-paper/65"
            : "border-ink/10 text-ink/60",
        )}
      >
        {dict.giveaway.entryRuleSummary}
      </p>
    </section>
  );
}

export function GiveawayEntryCount({
  entryCount,
  className,
}: {
  entryCount: number;
  className?: string;
}) {
  const dict = useDictionary();

  if (entryCount <= 0) {
    return null;
  }

  const label =
    entryCount === 1
      ? dict.giveaway.entryCountOne
      : dict.giveaway.entryCountMany.replace("{count}", String(entryCount));

  return (
    <p
      className={cn(
        "font-body text-xs font-bold uppercase tracking-aggressive text-accent",
        className,
      )}
    >
      {label}
    </p>
  );
}
