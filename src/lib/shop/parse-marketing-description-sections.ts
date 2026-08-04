export type MarketingDescriptionSection = {
  title: string;
  bodyHtml: string;
};

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

/** Split AI / WC marketing HTML into h2-led editorial sections. */
export function parseMarketingDescriptionSections(
  html: string,
): MarketingDescriptionSection[] {
  const trimmed = html.trim();
  if (!trimmed) {
    return [];
  }

  const sections: MarketingDescriptionSection[] = [];
  const pattern = /<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2[^>]*>|$)/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(trimmed)) !== null) {
    const title = stripHtml(match[1]);
    const bodyHtml = match[2].trim();

    if (!title || !bodyHtml) {
      continue;
    }

    sections.push({ title, bodyHtml });
  }

  if (sections.length > 0) {
    return sections;
  }

  return [{ title: "", bodyHtml: trimmed }];
}
