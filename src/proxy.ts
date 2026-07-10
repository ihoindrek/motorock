import { NextResponse, type NextRequest } from "next/server";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from "@/i18n/config";
import { resolveLegacyEquipmentRedirect } from "@/lib/shop/equipment-legacy-redirects";
import { resolveEquipmentPathPrefixRedirect } from "@/lib/shop/category-url";
import { resolveBrandPathPrefixRedirect } from "@/lib/shop/brand-url";
import { resolveProductPathPrefixRedirect } from "@/lib/shop/product-url";

function applyLocalePathRedirects(
  request: NextRequest,
  locale: Locale,
  basePath: string,
) {
  let resolvedPath = basePath;
  const legacyTarget = resolveLegacyEquipmentRedirect(basePath);

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
  return withLocaleHeader(response, locale);
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

function withLocaleHeader(response: NextResponse, locale: Locale) {
  response.headers.set("x-locale", locale);
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/favicon.ico" ||
    /\.[\w]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segment = pathname.split("/").filter(Boolean)[0];

  if (isLocale(segment)) {
    const basePath =
      pathname.slice(segment.length + 1) || "/";
    const redirectResponse = applyLocalePathRedirects(request, segment, basePath);

    if (redirectResponse) {
      return redirectResponse;
    }

    const response = NextResponse.next();
    response.cookies.set(localeCookieName, segment, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return withLocaleHeader(response, segment);
  }

  const locale = resolveLocale(request, segment);
  const redirectResponse = applyLocalePathRedirects(request, locale, pathname);

  if (redirectResponse) {
    return redirectResponse;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return withLocaleHeader(response, locale);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
