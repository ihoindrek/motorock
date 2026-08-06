import { z } from "zod";

export const RelatedProductItemSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  reason: z.string().min(8).max(160),
});

export const RelatedProductsOutputSchema = z.object({
  relatedSlugs: z
    .array(
      z
        .string()
        .min(2)
        .max(120)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    )
    .min(3)
    .max(6),
  items: z.array(RelatedProductItemSchema).min(3).max(6),
});

export type RelatedProductsOutput = z.infer<typeof RelatedProductsOutputSchema>;

export const RelatedProductsWritePayloadSchema = z.object({
  productId: z.number().int().positive(),
  locale: z.enum(["en", "et"]),
  relatedSlugs: z.array(z.string().min(2).max(120)).min(1).max(6),
  meta: z
    .object({
      provider: z.string(),
      model: z.string(),
      generatedAt: z.string().datetime(),
      jobId: z.string(),
      promptVersion: z.string(),
    })
    .optional(),
});

export type RelatedProductsWritePayload = z.infer<
  typeof RelatedProductsWritePayloadSchema
>;

export type RelatedProductsJobResult = {
  ok: boolean;
  dryRun: boolean;
  locale: "en" | "et";
  productId: number;
  preview?: RelatedProductsOutput;
  relatedSlugs?: string[];
  validationErrors?: string[];
  provider?: string;
  model?: string;
  durationMs: number;
};

export type RelatedProductCandidate = {
  slug: string;
  name: string;
  brand?: string;
  price: number;
  inStock: boolean;
  category: string;
  type: "motorcycle" | "equipment";
};
