import { NextResponse, type NextRequest } from "next/server";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from "@/i18n/config";

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
    pathname.startsWith("/_next") ||
    pathname === "/robots.txt" ||
    pathname === "/favicon.ico" ||
    /\.[\w]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segment = pathname.split("/").filter(Boolean)[0];

  if (isLocale(segment)) {
    const response = NextResponse.next();
    response.cookies.set(localeCookieName, segment, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  const locale = resolveLocale(request, segment);
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
