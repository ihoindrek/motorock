import { cookies, headers } from "next/headers";
import { defaultLocale, isLocale, localeCookieName, type Locale } from "@/i18n/config";

export async function getRequestLocale(): Promise<Locale> {
  const headerStore = await headers();
  const fromHeader = headerStore.get("x-locale");

  if (fromHeader && isLocale(fromHeader)) {
    return fromHeader;
  }

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(localeCookieName)?.value;

  if (fromCookie && isLocale(fromCookie)) {
    return fromCookie;
  }

  return defaultLocale;
}
