import type { RelatedProductsOutput } from "@/lib/commerce-ai/catalog/schemas";

export function validateRelatedProductsOutput(
  output: RelatedProductsOutput,
  input: {
    currentSlug: string;
    allowedSlugs: ReadonlySet<string>;
  },
): { ok: true; relatedSlugs: string[] } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const uniqueSlugs = [...new Set(output.relatedSlugs)];

  if (uniqueSlugs.length !== output.relatedSlugs.length) {
    errors.push("relatedSlugs must be unique");
  }

  if (uniqueSlugs.length < 3 || uniqueSlugs.length > 6) {
    errors.push("relatedSlugs must contain 3–6 items");
  }

  if (uniqueSlugs.includes(input.currentSlug)) {
    errors.push("relatedSlugs must not include the current product");
  }

  for (const slug of uniqueSlugs) {
    if (!input.allowedSlugs.has(slug)) {
      errors.push(`unknown slug: ${slug}`);
    }
  }

  const itemSlugs = output.items.map((item) => item.slug);
  for (const slug of itemSlugs) {
    if (!uniqueSlugs.includes(slug)) {
      errors.push(`items slug not in relatedSlugs: ${slug}`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, relatedSlugs: uniqueSlugs };
}
