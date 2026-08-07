/** Strip trailing slashes except the site root. */
export function normalizeUrlPath(pathname: string) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.replace(/\/+$/, "") || "/";
}

export function hasTrailingSlash(pathname: string) {
  return pathname.length > 1 && pathname.endsWith("/");
}
