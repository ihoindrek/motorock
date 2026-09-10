import type { Locale } from "@/i18n/config";

/** Europe/Tallinn calendar dates (YYYY-MM-DD) for when the banner is shown. */
const VISIBLE_FROM = "2026-09-09";
const VISIBLE_THROUGH = "2026-09-12";

const copy = {
  et: "Laupäeval 12.09 on esinduspood suletud.",
  en: "The showroom is closed on Saturday, 12 Sep.",
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
  const today = todayInTallinn(now);
  return today >= VISIBLE_FROM && today <= VISIBLE_THROUGH;
}

export function SiteAnnouncementBar({ locale }: { locale: Locale }) {
  if (!isSiteAnnouncementActive()) {
    return null;
  }

  return (
    <div
      role="status"
      className="bg-[#f0c8cf] px-4 py-2.5 text-center font-body text-[11px] font-semibold normal-case text-ink sm:text-xs"
    >
      {copy[locale]}
    </div>
  );
}
