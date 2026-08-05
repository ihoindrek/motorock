import type { BlogArticleOutput } from "@/lib/commerce-ai/blog/schemas";
import { findForbiddenHtmlTags } from "@/lib/ai/validation/html-safety";

export function validateBlogArticleOutput(output: BlogArticleOutput) {
  const errors: string[] = [];
  const warnings: string[] = [];

  const forbidden = findForbiddenHtmlTags(output.contentHtml);
  if (forbidden.length > 0) {
    errors.push(`Forbidden HTML tags: ${forbidden.join(", ")}`);
  }

  if (!output.contentHtml.includes("<h2")) {
    errors.push("contentHtml should include at least one h2 heading");
  }

  const plainLength = output.contentHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
  if (plainLength < 600) {
    errors.push("Article body is too short");
  }

  if (output.excerpt.includes("<")) {
    errors.push("excerpt must be plain text without HTML");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
