import type { ProductCategory } from "@/types/catalog-product";
import type { SizeGuide } from "@/types/size-guide";

const pandoMotoJacketMen: SizeGuide = {
  id: "pando-moto-jackets-men",
  title: "Pando Moto — men's jackets",
  brand: "Pando Moto",
  note: "Body measurements in cm. If you are between sizes, size up for layering.",
  columns: [
    { key: "chest", label: "Chest" },
    { key: "waist", label: "Waist" },
    { key: "length", label: "Back length" },
  ],
  rows: [
    { size: "XS", measurements: { chest: 88, waist: 74, length: 62 } },
    { size: "S", measurements: { chest: 92, waist: 78, length: 64 } },
    { size: "M", measurements: { chest: 98, waist: 84, length: 66 } },
    { size: "L", measurements: { chest: 104, waist: 90, length: 68 } },
    { size: "XL", measurements: { chest: 110, waist: 96, length: 70 } },
    { size: "XXL", measurements: { chest: 116, waist: 102, length: 72 } },
  ],
};

const johnnyRebPantsMen: SizeGuide = {
  id: "johnny-reb-pants-men",
  title: "Johnny Reb — men's pants",
  brand: "Johnny Reb",
  note: "Waist and inseam in cm. Measure at the narrowest point and along the inside leg.",
  columns: [
    { key: "waist", label: "Waist" },
    { key: "inseam", label: "Inseam" },
    { key: "hips", label: "Hips" },
  ],
  rows: [
    { size: "28", measurements: { waist: 71, inseam: 76, hips: 92 } },
    { size: "30", measurements: { waist: 76, inseam: 76, hips: 96 } },
    { size: "32", measurements: { waist: 81, inseam: 81, hips: 100 } },
    { size: "34", measurements: { waist: 86, inseam: 81, hips: 104 } },
    { size: "36", measurements: { waist: 91, inseam: 81, hips: 108 } },
  ],
};

const holyfreedomHoodie: SizeGuide = {
  id: "holyfreedom-hoodies",
  title: "Holyfreedom — hoodies",
  brand: "Holyfreedom",
  note: "Relaxed fit. Measurements in cm.",
  columns: [
    { key: "chest", label: "Chest" },
    { key: "length", label: "Length" },
    { key: "sleeve", label: "Sleeve" },
  ],
  rows: [
    { size: "S", measurements: { chest: 104, length: 68, sleeve: 62 } },
    { size: "M", measurements: { chest: 110, length: 70, sleeve: 64 } },
    { size: "L", measurements: { chest: 116, length: 72, sleeve: 66 } },
    { size: "XL", measurements: { chest: 122, length: 74, sleeve: 68 } },
  ],
};

/** brand slug → category → guide */
export const sizeGuidesByBrandCategory: Partial<
  Record<string, Partial<Record<ProductCategory, SizeGuide>>>
> = {
  "pando-moto": {
    jackets: pandoMotoJacketMen,
    vests: pandoMotoJacketMen,
  },
  "johnny-reb": {
    pants: johnnyRebPantsMen,
  },
  holyfreedom: {
    hoodies: holyfreedomHoodie,
    "t-shirts": holyfreedomHoodie,
  },
};

/** Demo fallback for any jacket without a brand-specific chart */
export const defaultCategoryGuides: Partial<Record<ProductCategory, SizeGuide>> =
  {
    jackets: {
      id: "generic-jackets-demo",
      title: "Jacket size guide (demo)",
      brand: "General",
      note: "Demo chart — replace with brand-specific measurements.",
      columns: [
        { key: "chest", label: "Chest" },
        { key: "waist", label: "Waist" },
        { key: "length", label: "Back length" },
      ],
      rows: [
        { size: "S", measurements: { chest: 92, waist: 78, length: 64 } },
        { size: "M", measurements: { chest: 98, waist: 84, length: 66 } },
        { size: "L", measurements: { chest: 104, waist: 90, length: 68 } },
        { size: "XL", measurements: { chest: 110, waist: 96, length: 70 } },
      ],
    },
  };
