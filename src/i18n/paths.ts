import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

export function localizedHref(locale: Locale, href: string) {
  const path = href.startsWith("/") ? href : `/${href}`;

  if (path === "/") {
    return `/${locale}`;
  }

  return `/${locale}${path}`;
}

export function stripLocaleFromPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length > 0 && isLocale(segments[0])) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }

  return pathname || "/";
}

export function getLocaleFromPath(pathname: string): Locale | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  return isLocale(segment) ? segment : null;
}

export function switchLocaleInPath(pathname: string, locale: Locale) {
  const basePath = stripLocaleFromPath(pathname);
  return localizedHref(locale, basePath);
}

export function resolveLocaleFromPath(pathname: string): Locale {
  return getLocaleFromPath(pathname) ?? defaultLocale;
}
