import type { Locale } from "@/i18n/config";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";
import type { BlogGenerateTarget } from "@/lib/commerce-ai/blog/schemas";

export function buildBlogPromptVariables(input: {
  locale: Locale;
  target: BlogGenerateTarget;
  product?: NormalizedProduct | null;
}) {
  const topic =
    input.target.topic?.trim() ||
    (input.product ? `Gear guide: ${input.product.name}` : "Motorcycle lifestyle article");

  const brief = input.target.brief?.trim() || "";

  const productContext = input.product
    ? [
        `Name: ${input.product.name}`,
        `Brand: ${input.product.brand}`,
        `Category: ${input.product.categoryPath.join(" > ")}`,
        `Slug: ${input.product.slug}`,
        `Price: ${input.product.price} ${input.product.currency}`,
      ].join("\n")
    : "None";

  return {
    locale: input.locale,
    topic,
    brief: brief || "Write a useful journal article for Motorock readers.",
    productContext,
  };
}
