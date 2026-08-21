import type { Locale } from "@/i18n/config";

/** Europe/Tallinn calendar date (YYYY-MM-DD) until which the banner is shown. */
const VISIBLE_THROUGH = "2026-08-31";

const copy = {
  et: {
    before: "10% soodsam koodiga ",
    after: " — kehtib augusti lõpuni",
  },
  en: {
    before: "10% off with code ",
    after: " — valid until end of August",
  },
} as const;

const COUPON_CODE = "AUGUST10";

function todayInTallinn(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Tallinn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isSiteAnnouncementActive(now = new Date()) {
  return todayInTallinn(now) <= VISIBLE_THROUGH;
}

export function SiteAnnouncementBar({ locale }: { locale: Locale }) {
  if (!isSiteAnnouncementActive()) {
    return null;
  }

  const message = copy[locale];

  return (
    <div
      role="status"
      className="bg-[#f0c8cf] px-4 py-2.5 text-center font-body text-[11px] font-semibold normal-case text-ink sm:text-xs"
    >
      {message.before}
      <span className="font-bold uppercase tracking-wide">{COUPON_CODE}</span>
      {message.after}
    </div>
  );
}
