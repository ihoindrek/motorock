import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatPrice } from "@/lib/shop/category";
import type { ProductCategory } from "@/types/catalog-product";

const META_DESCRIPTION_MAX = 160;
const TITLE_MAX = 58;
/** Prefer CMS copy when it is long enough to be useful in SERPs. */
const MIN_CMS_DESCRIPTION_LENGTH = 80;

export type ProductSeoCopyInput = {
  name: string;
  brand?: string;
  category?: ProductCategory;
  price: number;
  /** Existing short description from Woo / editorial. */
  description?: string;
};

function productDisplayName(brand: string | undefined, name: string) {
  const trimmedName = name.trim();
  const trimmedBrand = brand?.trim();

  if (!trimmedBrand) {
    return trimmedName;
  }

  if (trimmedName.toLowerCase().startsWith(trimmedBrand.toLowerCase())) {
    return trimmedName;
  }

  return `${trimmedBrand} ${trimmedName}`;
}

function truncateAtWord(text: string, maxLength: number) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const slice = normalized.slice(0, maxLength - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

export function resolveProductCategoryLabel(
  category: ProductCategory | undefined,
  dict: Dictionary,
): string | undefined {
  if (!category) {
    return undefined;
  }

  const menu = dict.equipmentMenu;
  const labels: Partial<Record<ProductCategory, string>> = {
    jackets: menu.jackets,
    vests: menu.vests,
    pants: menu.pants,
    gloves: menu.gloves,
    footwear: menu.footwear,
    hoodies: menu.hoodies,
    "t-shirts": menu.tshirts,
    "base-layers": menu.baseLayers,
    helmets: menu.helmets,
    "helmet-accessories": menu.helmets,
    goggles: menu.goggles,
    headwear: menu.headwear,
    bags: menu.bags,
    safety: menu.safety,
    scarves: menu.scarves,
    accessories: dict.nav.accessories,
    motorcycles: dict.nav.motorcycles,
    tools: dict.nav.tools,
  };

  return labels[category];
}

/** Title segment only — layout appends `| Motorock.eu`. */
export function buildProductSeoTitle(
  input: ProductSeoCopyInput,
  locale: Locale,
): string {
  const dict = getDictionary(locale);
  const product = productDisplayName(input.brand, input.name);
  const categoryLabel = resolveProductCategoryLabel(input.category, dict);

  // Keep titles scannable: add category only when there is room left for it.
  const withCategory =
    categoryLabel &&
    product.length <= 36 &&
    !product.toLowerCase().includes(categoryLabel.toLowerCase())
      ? `${product} — ${categoryLabel}`
      : product;

  return truncateAtWord(withCategory, TITLE_MAX);
}

export function buildProductSeoDescription(
  input: ProductSeoCopyInput,
  locale: Locale,
): string {
  const dict = getDictionary(locale);
  const cms = input.description?.replace(/\s+/g, " ").trim();

  if (cms && cms.length >= MIN_CMS_DESCRIPTION_LENGTH) {
    return truncateAtWord(cms, META_DESCRIPTION_MAX);
  }

  const product = productDisplayName(input.brand, input.name);
  const price = formatPrice(input.price, locale);
  const template = dict.seo.productMetaDescription
    .replace("{product}", product)
    .replace("{price}", price);

  return truncateAtWord(template, META_DESCRIPTION_MAX);
}
