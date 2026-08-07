"use client";

import { useState } from "react";
import { useDictionary } from "@/context/locale-context";
import { useVisitorCountry } from "@/hooks/use-visitor-country";
import {
  resolvePaymentTrustBadges,
  type PaymentTrustBadge,
} from "@/lib/shop/payment-trust-badges";
import { resolvePaymentMethodVisual } from "@/lib/shop/payment-method-visual";
import { cn } from "@/lib/utils";

type PaymentTrustBadgesProps = {
  className?: string;
  countryCode?: string;
};

function TrustBadge({ badge }: { badge: PaymentTrustBadge }) {
  const [logoFailed, setLogoFailed] = useState(false);

  if (badge.kind === "label") {
    return (
      <span
        title={badge.title}
        className="flex h-7 min-w-[3.5rem] items-center justify-center rounded-md border border-ink/10 bg-white px-1.5 font-body text-[9px] font-bold uppercase tracking-wide text-ink/60"
      >
        {badge.label}
      </span>
    );
  }

  const visual =
    badge.kind === "logo"
      ? { kind: "logo" as const, src: badge.src, alt: badge.title }
      : resolvePaymentMethodVisual(badge.gatewayId, badge.title, null);

  if (visual.kind === "logo" && !logoFailed) {
    return (
      <span
        title={badge.title}
        className="flex h-7 w-10 items-center justify-center rounded-md border border-ink/10 bg-white px-1"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={visual.src}
          alt=""
          width={40}
          height={28}
          className="h-5 w-auto max-w-[2.25rem] object-contain"
          loading="lazy"
          decoding="async"
          onError={() => setLogoFailed(true)}
        />
      </span>
    );
  }

  const fallback =
    visual.kind === "initials"
      ? visual.label
      : badge.title
          .split(/\s+/)
          .slice(0, 2)
          .map((word) => word[0]?.toUpperCase() ?? "")
          .join("") || "Pay";

  return (
    <span
      title={badge.title}
      className="flex h-7 min-w-[2.5rem] items-center justify-center rounded-md border border-ink/10 bg-white px-1.5 font-body text-[9px] font-bold uppercase tracking-wide text-ink/60"
    >
      {fallback}
    </span>
  );
}

export function PaymentTrustBadges({
  className,
  countryCode,
}: PaymentTrustBadgesProps) {
  const dict = useDictionary();
  const { country: visitorCountry, loading } = useVisitorCountry();
  const resolvedCountry = countryCode ?? visitorCountry;
  const badges = resolvePaymentTrustBadges(resolvedCountry, dict);

  if (loading && !countryCode) {
    return null;
  }

  return (
    <div className={cn("min-w-0", className)}>
      <p className="font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/40">
        {dict.pdp.paymentTrustLabel}
      </p>
      <ul
        className="mt-2 flex flex-wrap items-center gap-1.5"
        aria-label={dict.pdp.paymentTrustLabel}
      >
        {badges.map((badge) => (
          <li key={badge.id}>
            <TrustBadge badge={badge} />
          </li>
        ))}
      </ul>
    </div>
  );
}
