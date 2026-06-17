export type ProductGender = "men" | "women" | "unisex";
export type ProductType = "equipment" | "motorcycle";

export type ProductCategory =
  | "jackets"
  | "vests"
  | "pants"
  | "gloves"
  | "footwear"
  | "hoodies"
  | "t-shirts"
  | "base-layers"
  | "helmets"
  | "helmet-accessories"
  | "goggles"
  | "headwear"
  | "bags"
  | "belts"
  | "jewelry"
  | "scarves"
  | "socks"
  | "safety"
  | "accessories"
  | "tools"
  | "other"
  | "motorcycles";

export type ProductSpec = {
  id: string;
  label: string;
  value: string;
};

export type ProductColorOption = {
  label: string;
  /** WooCommerce attribute slug when label is formatted for display. */
  value?: string;
  hex?: string;
  image?: string;
};

export type ProductVariation = {
  databaseId?: number;
  sku: string;
  color: string;
  price?: number;
  image?: string;
  hex?: string;
};

export type CatalogProduct = {
  databaseId?: number;
  variationIds?: Readonly<Record<string, number>>;
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  lifestyleImage: string;
  sku?: string;
  shortDescription?: string;
  descriptionHtml?: string;
  variations?: readonly ProductVariation[];
  gallery?: readonly string[];
  lifestyleImages?: readonly string[];
  type: ProductType;
  gender: ProductGender;
  /** WooCommerce `for-men` / `for-women` membership for shop filters. */
  shopAudiences?: readonly ("men" | "women")[];
  category: ProductCategory;
  sizes: readonly string[];
  colors: readonly string[];
  colorOptions?: readonly ProductColorOption[];
  inStock: boolean;
  isNew: boolean;
  /** Motorcycle on display at Tallinn showroom — test ride available. */
  showroomAvailable?: boolean;
  headline?: string;
  tagline: string;
  description: string;
  specs: readonly ProductSpec[];
  engineSpecs?: readonly ProductSpec[];
  moreEngineSpecs?: readonly ProductSpec[];
  generalSpecs?: readonly ProductSpec[];
  features: readonly string[];
  relatedSlugs?: readonly string[];
  vimeoId?: string;
  backHref: string;
  backLabel: string;
};

export const allSizes = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "26",
  "28",
  "30",
  "32",
  "34",
  "36",
  "42",
  "43",
  "44",
  "45",
  "S/M",
  "L/XL",
  "One size",
] as const;
