import type {
  MotorcycleProduct,
  MotorcycleVariation,
  MotorockEnrichment,
} from "@/types/motorcycle-product";
import type {
  WooCommerceProduct,
  WooCommerceVariation,
} from "@/types/woocommerce";
import {
  excerptFromDescription,
} from "@/lib/shop/parse-product-description";
import { resolveMotorcycleCatalogCopy, parseMotorcycleShortDescription } from "@/lib/shop/parse-brixton-html";
import { normalizeMotorcycleContent } from "@/lib/shop/normalize-motorcycle-content";
import { resolveProductVimeoIdFromMeta } from "@/lib/shop/parse-product-video";
import { resolveShowroomAvailable } from "@/lib/shop/resolve-showroom-available";

const COLOR_ATTR_NAMES = new Set([
  "color",
  "colour",
  "värv",
  "finish",
]);

function parsePrice(value: string | number | undefined) {
  const parsed = Number.parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRecommendedPrice(product: WooCommerceProduct) {
  for (const meta of product.meta_data ?? []) {
    if (meta.key === "_recommended_price" && meta.value !== "") {
      return parsePrice(meta.value as string);
    }
  }

  return parsePrice(product.regular_price || product.price);
}

function resolveBrand(product: WooCommerceProduct) {
  if (product.brands?.[0]?.name) {
    return product.brands[0].name;
  }

  const categoryBrand = product.categories.find((category) =>
    ["brixton", "mutt", "motron", "malaguti"].some((needle) =>
      category.slug.includes(needle),
    ),
  );

  return categoryBrand?.name ?? product.categories[0]?.name ?? "Motorcycle";
}

function colorsFromAttributes(product: WooCommerceProduct) {
  const colorAttribute = product.attributes?.find((attribute) =>
    COLOR_ATTR_NAMES.has(attribute.name.toLowerCase()),
  );

  if (colorAttribute?.options?.length) {
    return colorAttribute.options;
  }

  if (colorAttribute?.option) {
    return [colorAttribute.option];
  }

  return [];
}

function mapVariation(
  variation: WooCommerceVariation,
): MotorcycleVariation | null {
  const colorAttr = variation.attributes.find((attribute) =>
    COLOR_ATTR_NAMES.has(attribute.name.toLowerCase()),
  );
  const color = colorAttr?.option ?? variation.attributes[0]?.option;

  if (!color) {
    return null;
  }

  return {
    sku: variation.sku,
    color,
    price: parsePrice(variation.regular_price || variation.price),
    image: variation.image?.src,
  };
}

/** Map live WooCommerce product (post-sync) → motorcycle view model. */
export function mapWooToMotorcycleProduct(
  product: WooCommerceProduct,
  variations: readonly WooCommerceVariation[],
  options: {
    slug: string;
    backHref?: string;
    backLabel?: string;
    enrichment?: MotorockEnrichment;
    /** Motorock retail override when CSV/manual price differs from API. */
    retailPrice?: number;
  },
): MotorcycleProduct {
  const colors = colorsFromAttributes(product);
  const mappedVariations = variations
    .map(mapVariation)
    .filter((variation): variation is MotorcycleVariation => variation !== null);

  const images = product.images.map((image) => image.src);
  const shortHtml = product.short_description || "";
  const longHtml = product.description || "";
  const catalogCopy = resolveMotorcycleCatalogCopy(longHtml, shortHtml);
  const parsedShort = parseMotorcycleShortDescription(shortHtml);
  const content = normalizeMotorcycleContent({
    shortHtml,
    longHtml,
    productImages: images,
    productName: product.name,
    brand: resolveBrand(product),
    vimeoId: resolveProductVimeoIdFromMeta(
      product.meta_data?.map((item) => ({
        key: item.key,
        value: String(item.value ?? ""),
      })),
    ),
    manualEnrichment: options.enrichment,
  });

  return {
    slug: options.slug,
    backHref: options.backHref ?? "/shop/motorcycles",
    backLabel: options.backLabel ?? "Motorcycles",
    sync: {
      sku: product.sku,
      name: product.name,
      brand: resolveBrand(product),
      price: options.retailPrice ?? getRecommendedPrice(product),
      shortDescription:
        shortHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ||
        excerptFromDescription(longHtml),
      descriptionHtml: catalogCopy.descriptionHtml,
      images,
      colors:
        colors.length > 0
          ? colors
          : mappedVariations.map((variation) => variation.color),
      variations: mappedVariations,
      inStock: product.stock_status === "instock",
    },
    content,
    enrichment: {
      ...options.enrichment,
      tagline: options.enrichment?.tagline ?? content.tagline,
      editorialSections:
        content.overviewSections.length > 0 ? content.overviewSections : undefined,
      highlightSpecs: content.keySpecs.length > 0 ? content.keySpecs : undefined,
      engineSpecs: content.engineSpecs.length > 0 ? content.engineSpecs : undefined,
      moreEngineSpecs:
        content.extendedSpecs.length > 0 ? content.extendedSpecs : undefined,
      generalSpecs:
        content.dimensionSpecs.length > 0 ? content.dimensionSpecs : undefined,
      vimeoId: content.vimeoId,
    },
    parsedSpecs: catalogCopy.parsedSpecs,
    showroomAvailable:
      options.enrichment?.showroomAvailable ??
      resolveShowroomAvailable(
        options.slug,
        product.meta_data?.map((item) => ({
          key: item.key,
          value: String(item.value ?? ""),
        })),
      ),
  };
}
