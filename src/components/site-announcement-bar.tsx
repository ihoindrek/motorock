import type { Locale } from "@/i18n/config";

/** Europe/Tallinn calendar date (YYYY-MM-DD) until which the banner is shown. */
const VISIBLE_THROUGH = "2026-08-20";

const copy = {
  et: "20. augustil on showroom suletud — veebist tellida saab",
  en: "Showroom closed on 20 August — online orders still welcome",
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
      className="border-b border-[#a88484]/30 bg-[#d4b5b0] px-4 py-2.5 text-center font-body text-[11px] font-bold uppercase tracking-aggressive text-ink sm:text-xs"
    >
      {copy[locale]}
    </div>
  );
}
