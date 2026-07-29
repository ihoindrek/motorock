import { SHOWROOM } from "@/data/showroom";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export function CheckoutSupportNotice({ locale }: { locale: Locale }) {
  const copy = getDictionary(locale).checkout;

  return (
    <p className="border border-ink/10 bg-surface/50 px-4 py-3 text-xs leading-relaxed text-ink/60">
      {copy.checkoutSupportHint}{" "}
      <a
        href={SHOWROOM.emailHref}
        className="text-ink underline decoration-ink/30 underline-offset-2 hover:text-accent"
      >
        {SHOWROOM.email}
      </a>
      .
    </p>
  );
}
