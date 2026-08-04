import type { SeoSectionOutput } from "@/lib/ai/validation/schemas";

function truncateAtWord(text: string, maxLength: number) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const slice = normalized.slice(0, maxLength - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

export function normalizeSeoSectionOutput(output: SeoSectionOutput): SeoSectionOutput {
  const keywords = [...new Set(output.keywords.map((k) => k.toLowerCase().trim()).filter(Boolean))];

  return {
    title: truncateAtWord(output.title, 58),
    metaDescription: truncateAtWord(output.metaDescription, 160),
    keywords: keywords.slice(0, 12),
  };
}
