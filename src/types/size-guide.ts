export type SizeGuideColumnKey =
  | "chest"
  | "waist"
  | "hips"
  | "length"
  | "inseam"
  | "sleeve";

export type SizeGuideColumn = {
  key: SizeGuideColumnKey;
  label: string;
};

export type SizeGuideRow = {
  size: string;
  measurements: Partial<Record<SizeGuideColumnKey, number>>;
};

import type {
  ProductCategory,
  ProductGender,
} from "@/types/catalog-product";

export type SizeGuideFit = "slim" | "regular" | "relaxed";

export type SizeGuide = {
  id: string;
  slug?: string;
  title: string;
  brand: string;
  brandSlug?: string;
  category?: ProductCategory;
  gender?: ProductGender;
  fit?: SizeGuideFit;
  note?: string;
  /** Rich text from WP (sanitized). Replaces generic how-to-measure when set. */
  contentHtml?: string;
  /** Illustration / measurement diagram URL. */
  imageUrl?: string;
  columns: readonly SizeGuideColumn[];
  rows: readonly SizeGuideRow[];
};
