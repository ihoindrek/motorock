"use client";

import { Lock, RefreshCw, ShieldCheck } from "lucide-react";
import { useDictionary } from "@/context/locale-context";
import { cn } from "@/lib/utils";

type EquipmentTrustBadgesProps = {
  className?: string;
};

export function EquipmentTrustBadges({ className }: EquipmentTrustBadgesProps) {
  const dict = useDictionary();

  const items = [
    {
      Icon: ShieldCheck,
      title: dict.pdp.trustOriginalTitle,
      subtext: dict.pdp.trustOriginalSubtext,
    },
    {
      Icon: RefreshCw,
      title: dict.pdp.trustExchangeTitle,
      subtext: dict.pdp.trustExchangeSubtext,
    },
    {
      Icon: Lock,
      title: dict.pdp.trustSecureTitle,
      subtext: dict.pdp.trustSecureSubtext,
    },
  ] as const;

  return (
    <ul
      aria-label={dict.pdp.trustBadgesAriaLabel}
      className={cn(
        "space-y-3 rounded-sm border border-ink/8 bg-ink/[0.025] px-3.5 py-3.5 sm:px-4",
        className,
      )}
    >
      {items.map(({ Icon, title, subtext }) => (
        <li key={title} className="flex gap-3">
          <Icon
            className="mt-0.5 size-4 shrink-0 text-ink/45"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs font-semibold leading-snug text-ink">{title}</p>
            <p className="text-[11px] leading-relaxed text-ink/55">{subtext}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
