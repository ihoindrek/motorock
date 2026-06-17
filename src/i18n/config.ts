export const locales = ["en", "et"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeCookieName = "NEXT_LOCALE";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "et";
}
