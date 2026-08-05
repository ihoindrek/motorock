import { z } from "zod";

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
};

export type BlogGenerateJobResult = {
  ok: boolean;
  dryRun: boolean;
  preview?: BlogArticleOutput;
  postId?: number;
  slug?: string;
  locale: "en" | "et";
  validationErrors?: string[];
  provider?: string;
  model?: string;
  durationMs: number;
};
