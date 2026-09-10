import { z } from "zod";
import type { BlogArticleType } from "@/lib/commerce-ai/blog/article-types";

export const BlogArticleOutputSchema = z.object({
  title: z.string().min(20).max(120),
  excerpt: z.string().min(80).max(320),
  contentHtml: z.string().min(400).max(50000),
  slugSuggestion: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  categorySlugs: z.array(z.string().min(2).max(40)).min(1).max(4),
});

export type BlogArticleOutput = z.infer<typeof BlogArticleOutputSchema>;

export const BlogWritePayloadSchema = z.object({
  locale: z.enum(["en", "et"]),
  title: z.string().min(1),
  excerpt: z.string(),
  contentHtml: z.string().min(1),
  slug: z.string().min(1),
  categorySlugs: z.array(z.string()).optional(),
  publishStatus: z.enum(["draft", "published"]).optional(),
  featuredImageUrl: z.string().url().optional(),
  featuredImageAlt: z.string().optional(),
  /** Existing post ID this post is a WPML translation of. */
  translationOfPostId: z.number().int().positive().optional(),
  meta: z.object({
    provider: z.string(),
    model: z.string(),
    generatedAt: z.string().datetime(),
    jobId: z.string(),
    promptVersion: z.string(),
  }),
});

export type BlogWritePayload = z.infer<typeof BlogWritePayloadSchema>;

export type BlogGenerateTarget = {
  topic?: string;
  brief?: string;
  productId?: number;
  /** WooCommerce category slug — pulls real products into the article as recommendations. */
  categorySlug?: string;
  /** Brand attribute slug (pa_brand) — pulls that brand's products into the article. */
  brandSlug?: string;
  /** Article structure preset. */
  articleType?: BlogArticleType;
  /** Generate both EN and ET versions and link them as WPML translations. */
  bothLocales?: boolean;
};

export type BlogGenerateJobResult = {
  ok: boolean;
  dryRun: boolean;
  preview?: BlogArticleOutput;
  postId?: number;
  slug?: string;
  editUrl?: string;
  locale: "en" | "et";
  validationErrors?: string[];
  warnings?: string[];
  provider?: string;
  model?: string;
  durationMs: number;
  /** Result for the second locale when both locales were requested. */
  pair?: BlogGenerateJobResult;
};
