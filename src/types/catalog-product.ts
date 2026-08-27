import type { ProductVideo } from "@/lib/shop/parse-product-video";

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
  /** Original price when variation is on sale. */
  regularPrice?: number;
  image?: string;
  hex?: string;
  inStock?: boolean;
};

export type CatalogProduct = {
  databaseId?: number;
  variationIds?: Readonly<Record<string, number>>;
  /** EN Woo IDs for Meta catalog (always use these in analytics content_ids). */
  metaCatalogProductId?: number;
  metaCatalogVariationIds?: Readonly<Record<string, number>>;
  slug: string;
  name: string;
  brand: string;
  price: number;
  /** Original price when product is on sale. */
  regularPrice?: number;
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
  /** Raw WooCommerce `productCategories` slugs from GraphQL. */
  wcCategorySlugs?: readonly string[];
  category: ProductCategory;
  sizes: readonly string[];
  colors: readonly string[];
  /** Inseam / leg length (petite, regular, tall) when product has pa_leg-length. */
  legLengths?: readonly string[];
  colorOptions?: readonly ProductColorOption[];
  inStock: boolean;
  isNew: boolean;
  /** ISO publish date from WooCommerce — used for homepage new-gear ordering. */
  publishedAt?: string;
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
  productVideo?: ProductVideo;
  /** Optional slug from WP Size Guides CPT — overrides brand/category lookup. */
  sizeGuideSlug?: string;
  /** @deprecated Prefer productVideo */
  vimeoId?: string;
  backHref: string;
  backLabel: string;
  /** AI-generated SEO overrides from Woo meta (when present). */
  aiSeo?: {
    title?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  faq?: readonly {
    question: string;
    answer: string;
  }[];
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
