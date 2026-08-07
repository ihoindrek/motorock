import type { ProductSpec } from "@/types/catalog-product";
import { htmlToPlainText } from "@/lib/shop/product-lead-copy";

function stripHtml(html: string) {
  return htmlToPlainText(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n"),
  );
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

/** Prefer long description; fall back to short when long is empty (common in WC admin). */
export function resolveProductDescriptionHtml(
  longHtml: string | null | undefined,
  shortHtml?: string | null | undefined,
): string | undefined {
  const long = longHtml?.trim();
  if (long) {
    return long;
  }

  const short = shortHtml?.trim();
  return short || undefined;
}
