const FORBIDDEN_TAGS = ["script", "iframe", "object", "embed", "form"] as const;

export function findForbiddenHtmlTags(html: string) {
  const found = new Set<string>();

  for (const tag of FORBIDDEN_TAGS) {
    const pattern = new RegExp(`<\\s*${tag}[\\s>/]`, "i");
    if (pattern.test(html)) {
      found.add(tag);
    }
  }

  return [...found];
}

export function sanitizeHtmlForAiOutput(html: string) {
  return html.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
}
