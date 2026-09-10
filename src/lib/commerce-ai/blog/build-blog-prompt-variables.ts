import type { Locale } from "@/i18n/config";
import type { NormalizedProduct } from "@/lib/ai/domain/normalized-product";
import { articleTypeInstructions } from "@/lib/commerce-ai/blog/article-types";
import type { BlogProductSuggestion } from "@/lib/commerce-ai/blog/blog-product-suggestions";
import { formatProductSuggestionsForPrompt } from "@/lib/commerce-ai/blog/blog-product-suggestions";
import type { RecentArticleLink } from "@/lib/commerce-ai/blog/recent-articles";
import { formatRecentArticlesForPrompt } from "@/lib/commerce-ai/blog/recent-articles";
import type { BlogGenerateTarget } from "@/lib/commerce-ai/blog/schemas";

export function buildBlogPromptVariables(input: {
  locale: Locale;
  target: BlogGenerateTarget;
  product?: NormalizedProduct | null;
  productSuggestions?: BlogProductSuggestion[];
  recentArticles?: RecentArticleLink[];
  /** When generating the second locale of a pair, align with the primary article. */
  pairWith?: { locale: Locale; title: string; excerpt: string };
}) {
  const topic =
    input.target.topic?.trim() ||
    (input.product
      ? `Gear guide: ${input.product.name}`
      : input.target.brandSlug
        ? `Brand feature: ${input.target.brandSlug}`
        : "Motorcycle lifestyle article");

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

  const pairContext = input.pairWith
    ? [
        `This article is the ${input.locale} language version of an existing ${input.pairWith.locale} article.`,
        `Original title: ${input.pairWith.title}`,
        `Original excerpt: ${input.pairWith.excerpt}`,
        `Cover the same subject and structure, fully written natively in ${input.locale} (not a literal translation).`,
      ].join("\n")
    : "None";

  return {
    locale: input.locale,
    currentDate: new Date().toISOString().slice(0, 10),
    topic,
    brief: brief || "Write a useful journal article for Motorock readers.",
    articleTypeInstructions: articleTypeInstructions(input.target.articleType),
    productContext,
    productCatalog: formatProductSuggestionsForPrompt(
      input.productSuggestions ?? [],
    ),
    recentArticles: formatRecentArticlesForPrompt(input.recentArticles ?? []),
    pairContext,
  };
}
