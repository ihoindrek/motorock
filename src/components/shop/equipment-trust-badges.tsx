"use client";

import { Lock, RefreshCw, ShieldCheck } from "lucide-react";
import { CheckoutCardBrandIcons } from "@/components/shop/checkout-card-brand-icons";
import { useDictionary } from "@/context/locale-context";
import {
  EQUIPMENT_TRUST_SECURE_PAYMENT_BRANDS,
  cardPaymentBrandAriaLabel,
  type CardPaymentBrand,
} from "@/lib/shop/card-payment-brands";
import { cn } from "@/lib/utils";

type EquipmentTrustBadgesProps = {
  className?: string;
};

export function EquipmentTrustBadges({ className }: EquipmentTrustBadgesProps) {
  const dict = useDictionary();

  const items: Array<{
    id: string;
    Icon: typeof ShieldCheck;
    title: string;
    subtext?: string;
    paymentBrands?: readonly CardPaymentBrand[];
  }> = [
    {
      id: "original",
      Icon: ShieldCheck,
      title: dict.pdp.trustOriginalTitle,
      subtext: dict.pdp.trustOriginalSubtext,
    },
    {
      id: "exchange",
      Icon: RefreshCw,
      title: dict.pdp.trustExchangeTitle,
      subtext: dict.pdp.trustExchangeSubtext,
    },
    {
      id: "secure",
      Icon: Lock,
      title: dict.pdp.trustSecureTitle,
      paymentBrands: EQUIPMENT_TRUST_SECURE_PAYMENT_BRANDS,
    },
  ];

  return (
    <ul
      aria-label={dict.pdp.trustBadgesAriaLabel}
      className={cn("space-y-3", className)}
    >
      {items.map(({ id, Icon, title, subtext, paymentBrands }) => (
        <li key={id} className="flex gap-3">
          <Icon
            className="mt-0.5 size-4 shrink-0 text-ink/45"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs font-semibold leading-snug text-ink">{title}</p>
            {subtext ? (
              <p className="text-[11px] leading-relaxed text-ink/55">{subtext}</p>
            ) : null}
            {paymentBrands ? (
              <CheckoutCardBrandIcons
                brands={paymentBrands}
                variant="row"
                className="min-w-0 flex-wrap gap-1.5 sm:gap-2"
                logoClassName="h-8 w-auto sm:h-9"
                aria-label={cardPaymentBrandAriaLabel(paymentBrands)}
              />
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
