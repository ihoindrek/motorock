"use client";

import { useDictionary } from "@/context/locale-context";

type CheckoutPaymentReturnBannerProps = {
  variant: "error" | "resume";
  onDismiss: () => void;
};

export function CheckoutPaymentReturnBanner({
  variant,
  onDismiss,
}: CheckoutPaymentReturnBannerProps) {
  const dict = useDictionary();

  return (
    <div
      className="mb-4 rounded-lg border border-accent/25 bg-accent/5 px-4 py-3"
      role="status"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-body text-sm font-bold uppercase tracking-aggressive text-ink">
            {variant === "error"
              ? dict.checkout.paymentReturnErrorTitle
              : dict.checkout.paymentReturnResumeTitle}
          </p>
          <p className="mt-1 text-sm text-ink/70">
            {variant === "error"
              ? dict.checkout.paymentReturnErrorBody
              : dict.checkout.paymentReturnResumeBody}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 border border-ink/15 px-2 py-1 font-body text-[10px] font-bold uppercase tracking-aggressive text-ink/70 transition-colors hover:border-ink/30 hover:text-ink"
        >
          {dict.checkout.paymentReturnDismiss}
        </button>
      </div>
    </div>
  );
}
