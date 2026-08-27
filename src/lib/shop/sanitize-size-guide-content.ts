const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "ul",
  "ol",
  "li",
  "h3",
  "h4",
  "blockquote",
]);

/** Strip unsafe markup from WP WYSIWYG size guide content. */
export function sanitizeSizeGuideContentHtml(
  html: string | null | undefined,
): string | undefined {
  if (!html?.trim()) {
    return undefined;
  }

  const cleaned = html
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, "")
    .replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (match, tagName: string) => {
      const tag = tagName.toLowerCase();

      if (!ALLOWED_TAGS.has(tag)) {
        return " ";
      }

      if (tag === "br") {
        return "<br />";
      }

      if (match.startsWith("</")) {
        return `</${tag}>`;
      }

      return `<${tag}>`;
    })
    .replace(/(?:\s|&nbsp;)+/g, " ")
    .trim();

  return cleaned || undefined;
}
