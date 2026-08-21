"use client";

import { CheckoutCardBrandIcons } from "@/components/shop/checkout-card-brand-icons";
import { useDictionary } from "@/context/locale-context";
import {
  EQUIPMENT_PDP_PAYMENT_BRANDS,
  cardPaymentBrandAriaLabel,
} from "@/lib/shop/card-payment-brands";
import { cn } from "@/lib/utils";

type EquipmentPaymentMethodsProps = {
  className?: string;
};

export function EquipmentPaymentMethods({ className }: EquipmentPaymentMethodsProps) {
  const dict = useDictionary();

  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}>
      <p className="shrink-0 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/40">
        {dict.pdp.paymentMethods}
      </p>
      <CheckoutCardBrandIcons
        brands={EQUIPMENT_PDP_PAYMENT_BRANDS}
        variant="compact"
        className="min-w-0 flex-wrap gap-1.5 sm:gap-2"
        aria-label={cardPaymentBrandAriaLabel(EQUIPMENT_PDP_PAYMENT_BRANDS)}
      />
    </div>
  );
}
