import { z } from "zod";
import type { ProductCategory } from "@/types/catalog-product";
import type { SizeGuide, SizeGuideColumnKey } from "@/types/size-guide";

const columnKeySchema = z.enum([
  "chest",
  "waist",
  "hips",
  "length",
  "inseam",
  "sleeve",
]);

const sizeGuideColumnSchema = z.object({
  key: columnKeySchema,
  label: z.string().min(1),
});

const sizeGuideRowSchema = z.object({
  size: z.string().min(1),
  measurements: z.record(columnKeySchema, z.number()),
});

const productCategorySchema = z.enum([
  "jackets",
  "vests",
  "pants",
  "gloves",
  "footwear",
  "hoodies",
  "t-shirts",
  "base-layers",
  "helmets",
  "helmet-accessories",
  "goggles",
  "headwear",
  "bags",
  "belts",
  "jewelry",
  "scarves",
  "socks",
  "safety",
  "accessories",
  "tools",
  "other",
  "motorcycles",
]);

export const remoteSizeGuideSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1).optional(),
  title: z.string().min(1),
  brand: z.string().min(1).optional(),
  brandSlug: z.string().min(1),
  category: productCategorySchema,
  gender: z.enum(["men", "women", "unisex"]),
  note: z.string().nullable().optional(),
  fit: z.enum(["slim", "regular", "relaxed"]).nullable().optional(),
  columns: z.array(sizeGuideColumnSchema).min(1),
  rows: z.array(sizeGuideRowSchema).min(1),
});

export const remoteSizeGuidesResponseSchema = z.object({
  ok: z.literal(true),
  guides: z.array(remoteSizeGuideSchema),
});

export function parseRemoteSizeGuide(input: unknown): SizeGuide | null {
  const parsed = remoteSizeGuideSchema.safeParse(input);
  if (!parsed.success) {
    return null;
  }

  const guide = parsed.data;
  return {
    id: guide.id,
    slug: guide.slug ?? guide.id,
    title: guide.title,
    brand: guide.brand ?? formatBrandLabel(guide.brandSlug),
    brandSlug: guide.brandSlug,
    category: guide.category as ProductCategory,
    gender: guide.gender,
    note: guide.note ?? undefined,
    fit: guide.fit ?? undefined,
    columns: guide.columns,
    rows: guide.rows.map((row) => ({
      size: row.size,
      measurements: row.measurements as Partial<
        Record<SizeGuideColumnKey, number>
      >,
    })),
  };
}

function formatBrandLabel(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
