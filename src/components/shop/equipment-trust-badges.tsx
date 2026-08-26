"use client";

import { Lock, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { CheckoutCardBrandIcons } from "@/components/shop/checkout-card-brand-icons";
import { useDictionary } from "@/context/locale-context";
import {
  EQUIPMENT_TRUST_SECURE_PAYMENT_BRANDS,
  cardPaymentBrandAriaLabel,
  type CardPaymentBrand,
} from "@/lib/shop/card-payment-brands";
import { qualifiesForFreeShipping } from "@/lib/shop/free-shipping";
import { cn } from "@/lib/utils";

type EquipmentTrustBadgesProps = {
  price?: number;
  className?: string;
};

export function EquipmentTrustBadges({
  price,
  className,
}: EquipmentTrustBadgesProps) {
  const dict = useDictionary();

  const items: Array<{
    id: string;
    Icon: typeof ShieldCheck;
    title: string;
    subtext?: string;
    paymentBrands?: readonly CardPaymentBrand[];
    span?: "full";
  }> = [];

  if (price !== undefined && qualifiesForFreeShipping(price)) {
    items.push({
      id: "free-shipping",
      Icon: Truck,
      title: dict.pdp.trustFreeShippingTitle,
    });
  }

  items.push(
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
      span: "full",
    },
  );

  return (
    <ul
      aria-label={dict.pdp.trustBadgesAriaLabel}
      className={cn("grid grid-cols-1 gap-y-2.5 sm:grid-cols-2 sm:gap-x-3", className)}
    >
      {items.map(({ id, Icon, title, subtext, paymentBrands, span }) => (
        <li
          key={id}
          className={cn(
            "min-w-0",
            span === "full" ? "sm:col-span-2" : undefined,
          )}
        >
          <div className="flex items-start gap-2">
            <Icon
              className="mt-0.5 size-3.5 shrink-0 text-ink/45"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-semibold leading-snug text-ink">
                {title}
              </p>
              {subtext ? (
                <p className="text-[10px] leading-snug text-ink/50">
                  {subtext}
                </p>
              ) : null}
              {paymentBrands ? (
                <CheckoutCardBrandIcons
                  brands={paymentBrands}
                  variant="row"
                  className="min-w-0 flex-wrap gap-1.5 pt-0.5 sm:gap-1"
                  logoClassName="h-8 w-auto sm:h-6"
                  aria-label={cardPaymentBrandAriaLabel(paymentBrands)}
                />
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
