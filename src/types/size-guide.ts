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

export type SizeGuide = {
  id: string;
  title: string;
  brand: string;
  note?: string;
  columns: readonly SizeGuideColumn[];
  rows: readonly SizeGuideRow[];
};
