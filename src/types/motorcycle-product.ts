import type { Locale } from "@/i18n/config";
import type { ProductSpec } from "@/types/catalog-product";
import type {
  MotorcyclePageContent,
} from "@/lib/shop/normalize-motorcycle-content";

export type MotorcycleVariation = {
  databaseId?: number;
  sku: string;
  color: string;
  price?: number;
  image?: string;
  hex?: string;
};

/**
 * Fields that Motorock Product Sync copies from Motomad (WC REST API).
 * Stock is forced to instock; real availability is not synced.
 */
export type MotomadSyncFields = {
  sku: string;
  name: string;
  brand: string;
  /** Motorock retail price (CSV / manual / adjusted — not raw B2B). */
  price: number;
  shortDescription: string;
  /** Supplier HTML — often contains a spec table. */
  descriptionHtml: string;
  images: readonly string[];
  colors: readonly string[];
  variations: readonly MotorcycleVariation[];
  inStock: boolean;
};

/**
 * Editorial content added on Motorock.eu (ACF / manual), not from Motomad sync.
 */
export type MotorockEnrichment = {
  tagline?: string;
  /** DESIGN / EQUIPMENT blocks parsed from supplier short description. */
  editorialSections?: readonly {
    title: string;
    paragraphs: readonly string[];
  }[];
  lifestyleImages?: readonly string[];
  features?: readonly string[];
  highlightSpecs?: readonly ProductSpec[];
  engineSpecs?: readonly ProductSpec[];
  moreEngineSpecs?: readonly ProductSpec[];
  generalSpecs?: readonly ProductSpec[];
  vimeoId?: string;
  relatedSlugs?: readonly string[];
  isNew?: boolean;
  /** Set in Woo via ACF field `showroom_available` (Motorock toode). */
  showroomAvailable?: boolean;
  /** Per-colour swatches when curated manually (hex not in Motomad). */
  colorSwatches?: readonly { label: string; hex?: string; image?: string }[];
};

export type MotorcycleProduct = {
  slug: string;
  databaseId?: number;
  /** Language of synced copy from WooCommerce / GraphQL (may differ from page locale). */
  contentLocale: Locale;
  /** ET page shows EN copy because the WP translation was not filled in yet. */
  contentUntranslated?: boolean;
  backHref: string;
  backLabel: string;
  /** True when this bike is on display in Tallinn and test rides can be booked. */
  showroomAvailable: boolean;
  sync: MotomadSyncFields;
  /** Normalized PDP sections — same layout for every motorcycle. */
  content: MotorcyclePageContent;
  enrichment: MotorockEnrichment;
  /** AI-generated SEO overrides from Woo meta (when present). */
  aiSeo?: {
    title?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  /** @deprecated Use content.keySpecs / content.engineSpecs — raw parse output. */
  parsedSpecs: readonly ProductSpec[];
};
