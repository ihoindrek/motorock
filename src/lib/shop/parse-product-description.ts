import type { ProductSpec } from "@/types/catalog-product";

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyId(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Extract label/value rows from supplier HTML tables (common in Motomad listings). */
export function parseSpecsFromDescriptionHtml(html: string): ProductSpec[] {
  const specs: ProductSpec[] = [];
  const rowPattern =
    /<tr[^>]*>[\s\S]*?<t[dh][^>]*>([\s\S]*?)<\/t[dh]>[\s\S]*?<t[dh][^>]*>([\s\S]*?)<\/t[dh]>[\s\S]*?<\/tr>/gi;

  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(html)) !== null) {
    const label = stripHtml(match[1]);
    const value = stripHtml(match[2]);

    if (!label || !value || label.toLowerCase() === "specification") {
      continue;
    }

    specs.push({
      id: slugifyId(label) || `spec-${specs.length}`,
      label,
      value,
    });
  }

  return specs;
}

export function excerptFromDescription(html: string, maxLength = 160) {
  const text = stripHtml(html);
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).replace(/\s+\S*$/, "")}…`;
}

export function hasRichHtmlDescription(html: string) {
  return /<(table|ul|ol|h[2-6])\b/i.test(html);
}
