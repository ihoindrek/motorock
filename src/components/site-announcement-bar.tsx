import type { Locale } from "@/i18n/config";

/** Europe/Tallinn calendar date (YYYY-MM-DD) until which the banner is shown. */
const VISIBLE_THROUGH = "2026-08-20";

const copy = {
  et: "Showroom on 20.08 suletud",
  en: "Showroom closed on 20 August",
} as const;

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

  return (
    <div
      role="status"
      className="border-b border-accent/20 bg-accent px-4 py-2.5 text-center font-body text-[11px] font-bold uppercase tracking-aggressive text-paper sm:text-xs"
    >
      {copy[locale]}
    </div>
  );
}
