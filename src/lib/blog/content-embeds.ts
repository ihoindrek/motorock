/**
 * Blog content can contain product embed markers written by the AI generator:
 *   [motorock_products slugs="slug-one,slug-two"]
 * The storefront replaces them with live product cards.
 */

export type BlogContentSegment =
  | { type: "html"; html: string }
  | { type: "products"; slugs: string[] };

const EMBED_PATTERN =
  /(?:<p>\s*)?\[motorock_products\s+slugs=(?:"|&quot;|&#8221;|&#8243;)([^\]"”]+?)(?:"|&quot;|&#8221;|&#8243;)\s*\](?:\s*<\/p>)?/gi;

export function splitBlogContentSegments(html: string): BlogContentSegment[] {
  const segments: BlogContentSegment[] = [];
  let lastIndex = 0;

  for (const match of html.matchAll(EMBED_PATTERN)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      segments.push({ type: "html", html: html.slice(lastIndex, index) });
    }

    const slugs = match[1]
      .split(",")
      .map((slug) => slug.trim().toLowerCase())
      .filter((slug) => /^[a-z0-9-]+$/.test(slug));

    if (slugs.length > 0) {
      segments.push({ type: "products", slugs });
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < html.length) {
    segments.push({ type: "html", html: html.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "html", html }];
}
