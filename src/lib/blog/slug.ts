/** Decode percent-encoded blog slugs from route params or links. */
export function normalizeBlogSlug(slug: string): string {
  if (!slug.includes("%")) {
    return slug;
  }

  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export function blogSlugsMatch(a: string, b?: string | null): boolean {
  if (!b) {
    return false;
  }

  return normalizeBlogSlug(a) === normalizeBlogSlug(b);
}
