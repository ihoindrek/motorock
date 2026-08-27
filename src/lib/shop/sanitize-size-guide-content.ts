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

/** WP WYSIWYG sometimes stores literal `n` instead of newlines between tags. */
function normalizeWpNewlineArtifacts(html: string) {
  return html
    .replace(/\r\n/g, "\n")
    .replace(/(<\/?(?:p|ol|ul|li|h[34]|blockquote)[^>]*>)\s*n\s*/gi, "$1")
    .replace(/(<br\s*\/?>)\s*n(?=\s*[A-Za-z(])/gi, "$1")
    .replace(/>\s*n\s*(?=[A-Za-z(])/g, ">")
    .replace(/>\s*n\s*</g, "><");
}

/** Strip unsafe markup from WP WYSIWYG size guide content. */
export function sanitizeSizeGuideContentHtml(
  html: string | null | undefined,
): string | undefined {
  if (!html?.trim()) {
    return undefined;
  }

  const cleaned = normalizeWpNewlineArtifacts(html)
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
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned || undefined;
}
