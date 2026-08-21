import { NextResponse, type NextRequest } from "next/server";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from "@/i18n/config";
import { resolveLegacyEquipmentRedirect } from "@/lib/shop/equipment-legacy-redirects";
import {
  inferLocaleFromLegacyPath,
  resolveWordPressLegacyRedirect,
} from "@/lib/shop/wordpress-legacy-redirects";
import { resolveEquipmentPathPrefixRedirect, resolveEncodedSlashEquipmentPath } from "@/lib/shop/category-url";
import { resolveBrandPathPrefixRedirect, resolveLegacyBrandSlugRedirect } from "@/lib/shop/brand-url";
import { resolveProductPathPrefixRedirect } from "@/lib/shop/product-url";
import {
  hasTrailingSlash,
  normalizeUrlPath,
} from "@/lib/seo/normalize-url-path";

/** Routes that live outside /[locale] and must not get a locale prefix. */
export function isLocaleBypassPath(pathname: string) {
  return (
    pathname === "/order/payment-return" ||
    pathname.startsWith("/order/payment-return/")
  );
}

function applyLocalePathRedirects(
  request: NextRequest,
  locale: Locale,
  basePath: string,
) {
  let resolvedPath = basePath;
  const encodedSlashTarget = resolveEncodedSlashEquipmentPath(resolvedPath);

  if (encodedSlashTarget) {
    resolvedPath = encodedSlashTarget;
  }

  const wordpressTarget = resolveWordPressLegacyRedirect(resolvedPath, locale);

  if (wordpressTarget) {
    resolvedPath = wordpressTarget;
  }

  const legacyTarget = resolveLegacyEquipmentRedirect(resolvedPath);

  if (legacyTarget) {
    resolvedPath = legacyTarget;
  }

  const prefixTarget = resolveEquipmentPathPrefixRedirect(resolvedPath, locale);

  if (prefixTarget) {
    resolvedPath = prefixTarget;
  }

  const brandPrefixTarget = resolveBrandPathPrefixRedirect(resolvedPath, locale);

  if (brandPrefixTarget) {
    resolvedPath = brandPrefixTarget;
  }

  const legacyBrandTarget = resolveLegacyBrandSlugRedirect(resolvedPath, locale);

  if (legacyBrandTarget) {
    resolvedPath = legacyBrandTarget;
  }

  const productPrefixTarget = resolveProductPathPrefixRedirect(
    resolvedPath,
    locale,
  );

  if (productPrefixTarget) {
    resolvedPath = productPrefixTarget;
  }

  if (resolvedPath === basePath) {
    return null;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/${locale}${resolvedPath}`;
  const response = NextResponse.redirect(redirectUrl, 308);
  response.cookies.set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

function resolveLocale(request: NextRequest, segment: string | undefined): Locale {
  if (isLocale(segment)) {
    return segment;
  }

  const cookieLocale = request.cookies.get(localeCookieName)?.value;
  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/.well-known/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/sitemaps/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/favicon.ico" ||
    isLocaleBypassPath(pathname) ||
    /\.[\w]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (hasTrailingSlash(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = normalizeUrlPath(pathname);
    return NextResponse.redirect(redirectUrl, 308);
  }

  const segment = pathname.split("/").filter(Boolean)[0];

  if (isLocale(segment)) {
    const basePath =
      pathname.slice(segment.length + 1) || "/";

    if (isLocaleBypassPath(basePath)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = basePath;
      return NextResponse.redirect(redirectUrl, 308);
    }

    const redirectResponse = applyLocalePathRedirects(request, segment, basePath);

    if (redirectResponse) {
      return redirectResponse;
    }

    // No Set-Cookie on pass-through responses: it would make them
    // uncacheable at the CDN (crawlers never send cookies, so they would
    // always miss). LocaleProvider persists the locale cookie client-side.
    return NextResponse.next();
  }

  const locale = resolveLocale(request, segment);
  const pathLocale = inferLocaleFromLegacyPath(pathname);
  const effectiveLocale = pathLocale ?? locale;
  const redirectResponse = applyLocalePathRedirects(
    request,
    effectiveLocale,
    pathname,
  );

  if (redirectResponse) {
    return redirectResponse;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname =
    pathname === "/" ? `/${effectiveLocale}` : `/${effectiveLocale}${pathname}`;

  const response = NextResponse.redirect(redirectUrl, 308);
  response.cookies.set(localeCookieName, effectiveLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: [
    /*
     * Run proxy on app pages only. Exclude metadata/SEO files entirely —
     * GSC is sensitive to middleware touching sitemap/robots.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|sitemaps/).*)",
  ],
};
