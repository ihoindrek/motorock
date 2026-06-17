/**
 * Minimal WooCommerce REST API shapes as returned by Motomad.eu.
 * Motorock Product Sync reads these fields on import.
 */

export type WooCommerceImage = {
  id: number;
  src: string;
  name?: string;
  alt?: string;
};

export type WooCommerceAttribute = {
  id: number;
  name: string;
  slug?: string;
  option?: string;
  options?: string[];
  variation?: boolean;
};

export type WooCommerceVariation = {
  id: number;
  sku: string;
  price: string;
  regular_price: string;
  stock_status?: string;
  attributes: readonly {
    id: number;
    name: string;
    option: string;
  }[];
  image?: WooCommerceImage;
};

export type WooCommerceMetaData = {
  id: number;
  key: string;
  value: string | number | boolean | null;
};

/**
 * Product object from Motomad WC REST API (`/wp-json/wc/v3/products`).
 * Sync engine maps: name, sku, description, short_description, images,
 * categories, brands, variations, meta_data `_recommended_price`.
 */
export type WooCommerceProduct = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  type: "simple" | "variable" | string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  stock_status: string;
  images: readonly WooCommerceImage[];
  categories: readonly { id: number; name: string; slug: string }[];
  attributes?: readonly WooCommerceAttribute[];
  variations?: readonly number[];
  meta_data?: readonly WooCommerceMetaData[];
  brands?: readonly { id: number; name: string; slug: string }[];
};
