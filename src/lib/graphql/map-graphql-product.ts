import { brands } from "@/data/brands";
import type {
  CatalogProduct,
  ProductCategory,
  ProductGender,
} from "@/types/catalog-product";
import type { MotorcycleProduct } from "@/types/motorcycle-product";
import type {
  GraphQLProduct,
  GraphQLProductCard,
  GraphQLVariableProduct,
} from "@/lib/graphql/types";
import {
  parseMotorcycleShortDescription,
  resolveMotorcycleCatalogCopy,
  splitCatalogImages,
} from "@/lib/shop/parse-brixton-html";
import { parseGraphqlPrice } from "@/lib/shop/parse-graphql-price";
import { getCanonicalBrandName } from "@/lib/shop/brands";
import { parseSpecsFromDescriptionHtml } from "@/lib/shop/parse-product-description";
import { resolveCategoryFromWcNodes } from "@/lib/shop/wc-categories";
import { sortProductSizes } from "@/lib/shop/sort-sizes";
import { resolveShowroomAvailable } from "@/lib/shop/resolve-showroom-available";
import { normalizeMotorcycleContent } from "@/lib/shop/normalize-motorcycle-content";
import { resolveProductVimeoIdFromMeta } from "@/lib/shop/parse-product-video";

const COLOR_ATTR_NAMES = new Set(["color", "colour", "värv", "finish"]);
const SIZE_ATTR_NAMES = new Set(["size", "suurus"]);

function normalizeAttributeName(name: string) {
  return name.toLowerCase().replace(/^pa_/, "");
}

function isColorAttributeName(name: string) {
  const normalized = normalizeAttributeName(name);
  return COLOR_ATTR_NAMES.has(normalized);
}

function isSizeAttributeName(name: string) {
  const normalized = normalizeAttributeName(name);
  return SIZE_ATTR_NAMES.has(normalized) || normalized.includes("size");
}

function formatSizeLabel(value: string) {
  return value
    .replace(/^w(\d+)-l(\d+)$/i, "W$1/L$2")
    .replace(/^(\d+)$/, (_, digits: string) => digits.toUpperCase());
}
const MOTORCYCLE_BRAND_SLUGS = new Set(["brixton", "mutt", "motron", "malaguti"]);

function isMotorcycleProduct(categories: GraphQLProduct["productCategories"]) {
  const nodes = categories?.nodes ?? [];

  return nodes.some(
    (category) =>
      category.slug === "motorcycles" ||
      category.parent?.node?.slug === "motorcycles",
  );
}

function resolveMotorcycleBrand(categories: GraphQLProduct["productCategories"]) {
  const nodes = categories?.nodes ?? [];
  const brandCategory = nodes.find(
    (category) => category.parent?.node?.slug === "motorcycles",
  );

  const raw = brandCategory?.name ?? nodes[0]?.name ?? "Motorcycle";

  return getCanonicalBrandName(raw);
}

function resolveEquipmentBrand(
  productName: string,
  attributes?: GraphQLVariableProduct["attributes"] | null,
) {
  const brandAttribute = attributes?.nodes.find(
    (attribute) => normalizeAttributeName(attribute.name) === "brand",
  );
  const brandSlug = brandAttribute?.options?.[0];

  if (brandSlug) {
    const normalized = brandSlug.toLowerCase();
    const fromConfig = brands.find(
      (brand) =>
        !MOTORCYCLE_BRAND_SLUGS.has(brand.slug) &&
        (brand.slug === normalized ||
          brand.slug.replace(/-/g, "") === normalized.replace(/-/g, "") ||
          brand.slug.startsWith(`${normalized}-`) ||
          brand.name.toLowerCase().startsWith(normalized)),
    );

    if (fromConfig) {
      return fromConfig.name;
    }

    return brandSlug
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  const lower = productName.toLowerCase();

  for (const brand of brands) {
    if (MOTORCYCLE_BRAND_SLUGS.has(brand.slug)) {
      continue;
    }

    const needle = brand.name.toLowerCase().split(/\s+/)[0];
    if (needle.length > 2 && lower.includes(needle)) {
      return brand.name;
    }
  }

  return "Motorock";
}

function parseCardPrice(product: GraphQLProductCard) {
  return parseGraphqlPrice(product.price ?? product.regularPrice);
}

function hasGenderCategory(
  nodes: NonNullable<GraphQLProduct["productCategories"]>["nodes"],
  genderSlug: "for-men" | "for-women",
) {
  return nodes.some(
    (node) =>
      node.slug === genderSlug || node.parent?.node?.slug === genderSlug,
  );
}

function resolveShopAudiences(
  nodes: NonNullable<GraphQLProduct["productCategories"]>["nodes"],
): ("men" | "women")[] {
  const audiences: ("men" | "women")[] = [];

  if (hasGenderCategory(nodes, "for-men")) {
    audiences.push("men");
  }

  if (hasGenderCategory(nodes, "for-women")) {
    audiences.push("women");
  }

  return audiences;
}

function resolveEquipmentMeta(
  categories: GraphQLProduct["productCategories"],
  productName: string,
) {
  const nodes = categories?.nodes ?? [];
  const slugs = nodes.map((node) => node.slug);
  const hasMen = hasGenderCategory(nodes, "for-men");
  const hasWomen = hasGenderCategory(nodes, "for-women");

  let gender: ProductGender = "unisex";
  if (hasMen && !hasWomen) {
    gender = "men";
  } else if (hasWomen && !hasMen) {
    gender = "women";
  }

  const category = resolveCategoryFromWcNodes(slugs, productName);

  return { gender, category };
}

function displayName(fullName: string, brand: string) {
  const prefix = `${brand} `;
  return fullName.startsWith(prefix)
    ? fullName.slice(prefix.length)
    : fullName;
}

function colorsFromVariableProduct(product: GraphQLVariableProduct) {
  const colorAttribute = product.attributes?.nodes.find((attribute) =>
    isColorAttributeName(attribute.name),
  );

  if (colorAttribute?.options?.length) {
    return colorAttribute.options;
  }

  const fromVariations = (product.variations?.nodes ?? [])
    .map((variation) =>
      variation.attributes?.nodes.find((attribute) =>
        isColorAttributeName(attribute.name),
      ),
    )
    .filter(Boolean)
    .map((attribute) => attribute!.value);

  return [...new Set(fromVariations)];
}

function sizesFromVariableProduct(product: GraphQLVariableProduct) {
  const sizeAttribute = product.attributes?.nodes.find((attribute) =>
    isSizeAttributeName(attribute.name),
  );

  if (sizeAttribute?.options?.length) {
    return sortProductSizes(sizeAttribute.options.map(formatSizeLabel));
  }

  const fromVariations = (product.variations?.nodes ?? [])
    .map((variation) =>
      variation.attributes?.nodes.find((attribute) =>
        isSizeAttributeName(attribute.name),
      ),
    )
    .filter(Boolean)
    .map((attribute) => formatSizeLabel(attribute!.value));

  return sortProductSizes([...new Set(fromVariations)]);
}

function mapVariations(product: GraphQLVariableProduct) {
  return (product.variations?.nodes ?? []).map((variation) => {
    const color =
      variation.attributes?.nodes.find((attribute) =>
        isColorAttributeName(attribute.name),
      )?.value ??
      variation.attributes?.nodes[0]?.value ??
      variation.name ??
      "Default";

    return {
      databaseId: variation.databaseId,
      sku: variation.sku ?? `${product.slug}-${variation.databaseId}`,
      color,
      price: parseGraphqlPrice(variation.regularPrice ?? variation.price),
      image: variation.image?.sourceUrl,
    };
  });
}

function variationIdsFromProduct(product: GraphQLVariableProduct) {
  const variationIds: Record<string, number> = {};

  for (const variation of product.variations?.nodes ?? []) {
    const attributes = variation.attributes?.nodes ?? [];
    const size = attributes.find((attribute) =>
      isSizeAttributeName(attribute.name),
    );
    const color = attributes.find((attribute) =>
      isColorAttributeName(attribute.name),
    );

    if (size) {
      variationIds[formatSizeLabel(size.value)] = variation.databaseId;
    } else if (color) {
      variationIds[color.value] = variation.databaseId;
    }
  }

  return Object.keys(variationIds).length > 0 ? variationIds : undefined;
}

function getMetaValue(
  meta: GraphQLProduct["metaData"],
  key: string,
): string | undefined {
  const entry = meta?.find((item) => item.key === key);
  return entry?.value ?? undefined;
}

export function mapGraphqlToMotorcycleProduct(
  product: GraphQLProduct,
): MotorcycleProduct {
  const brand = resolveMotorcycleBrand(product.productCategories);
  const shortHtml = product.shortDescription ?? "";
  const longHtml = product.description ?? "";
  const parsedShort = parseMotorcycleShortDescription(shortHtml);
  const catalogCopy = resolveMotorcycleCatalogCopy(longHtml, shortHtml);
  const { descriptionHtml } = catalogCopy;

  const galleryUrls = (product.galleryImages?.nodes ?? []).map(
    (image) => image.sourceUrl,
  );
  const { productImages, lifestyleImages } = splitCatalogImages(
    product.image?.sourceUrl,
    galleryUrls,
  );

  const isVariable = product.__typename === "VariableProduct";
  const colors = isVariable ? colorsFromVariableProduct(product) : [];

  const variations = isVariable ? mapVariations(product) : [];

  const price = isVariable
    ? parseGraphqlPrice(product.price ?? product.regularPrice)
  : parseGraphqlPrice(product.regularPrice ?? product.price);

  const content = normalizeMotorcycleContent({
    shortHtml,
    longHtml,
    productImages,
    lifestyleImages,
    vimeoId: resolveProductVimeoIdFromMeta(product.metaData),
    productName: displayName(product.name, brand),
    brand,
  });

  return {
    slug: product.slug,
    databaseId: product.databaseId,
    backHref: "/shop/motorcycles",
    backLabel: "Motorcycles",
    showroomAvailable: resolveShowroomAvailable(product.slug, product.metaData),
    sync: {
      sku: product.sku ?? product.slug,
      name: displayName(product.name, brand),
      brand,
      price,
      shortDescription:
        parsedShort.tagline ??
        (shortHtml
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 180) || ""),
      descriptionHtml,
      images: productImages,
      colors,
      variations,
      inStock: product.stockStatus === "IN_STOCK",
    },
    content,
    enrichment: {
      tagline: content.tagline,
      editorialSections:
        content.overviewSections.length > 0 ? content.overviewSections : undefined,
      highlightSpecs: content.keySpecs.length > 0 ? content.keySpecs : undefined,
      engineSpecs: content.engineSpecs.length > 0 ? content.engineSpecs : undefined,
      moreEngineSpecs:
        content.extendedSpecs.length > 0 ? content.extendedSpecs : undefined,
      generalSpecs:
        content.dimensionSpecs.length > 0 ? content.dimensionSpecs : undefined,
      lifestyleImages:
        lifestyleImages.length > 0 ? lifestyleImages : undefined,
      vimeoId: content.vimeoId,
    },
    parsedSpecs: catalogCopy.parsedSpecs,
  };
}

export function mapGraphqlToCatalogProduct(product: GraphQLProduct): CatalogProduct {
  const isMotorcycle = isMotorcycleProduct(product.productCategories);
  const isVariable = product.__typename === "VariableProduct";
  const variableProduct = isVariable ? product : null;
  const brand = isMotorcycle
    ? resolveMotorcycleBrand(product.productCategories)
    : resolveEquipmentBrand(product.name, product.attributes);
  const equipmentMeta = isMotorcycle
    ? { gender: "unisex" as const, category: "motorcycles" as const }
    : resolveEquipmentMeta(product.productCategories, product.name);
  const shopAudiences = isMotorcycle
    ? undefined
    : resolveShopAudiences(product.productCategories?.nodes ?? []);
  const galleryUrls = (product.galleryImages?.nodes ?? []).map(
    (image) => image.sourceUrl,
  );
  const featured = product.image?.sourceUrl ?? galleryUrls[0] ?? "";
  const { productImages, lifestyleImages } = splitCatalogImages(
    featured,
    galleryUrls,
  );

  const colors = isVariable ? colorsFromVariableProduct(product) : [];
  const sizes = isVariable ? sizesFromVariableProduct(product) : ["One size"];

  const price = parseGraphqlPrice(
    isVariable
      ? (product.price ?? product.regularPrice)
      : (product.regularPrice ?? product.price),
  );

  const parsedShort = parseMotorcycleShortDescription(product.shortDescription ?? "");
  const descriptionHtml = product.description ?? undefined;
  const plainDescription =
    descriptionHtml?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? "";
  const equipmentSpecs =
    !isMotorcycle && descriptionHtml
      ? parseSpecsFromDescriptionHtml(descriptionHtml)
      : [];

  return {
    slug: product.slug,
    databaseId: product.databaseId,
    variationIds: variableProduct
      ? variationIdsFromProduct(variableProduct)
      : undefined,
    name: isMotorcycle ? displayName(product.name, brand) : product.name,
    brand,
    price,
    sku: product.sku ?? product.slug,
    image: productImages[0] ?? featured,
    lifestyleImage: lifestyleImages[0] ?? productImages[0] ?? featured,
    gallery: productImages.length > 1 ? productImages : undefined,
    lifestyleImages: lifestyleImages.length > 0 ? lifestyleImages : undefined,
    shortDescription:
      parsedShort.tagline ??
      (plainDescription.slice(0, 180) || undefined),
    descriptionHtml,
    description: plainDescription,
    type: isMotorcycle ? "motorcycle" : "equipment",
    gender: equipmentMeta.gender,
    shopAudiences,
    category: equipmentMeta.category,
    sizes: sizes.length > 0 ? sizes : ["One size"],
    colors: colors.length > 0 ? colors : ["—"],
    inStock: product.stockStatus === "IN_STOCK",
    isNew: false,
    showroomAvailable: isMotorcycle
      ? resolveShowroomAvailable(product.slug, product.metaData)
      : undefined,
    headline: parsedShort.tagline,
    tagline: parsedShort.tagline ?? plainDescription.slice(0, 120),
    specs: equipmentSpecs,
    features: parsedShort.features,
    backHref: isMotorcycle
      ? "/shop/motorcycles"
      : equipmentMeta.category === "tools"
        ? "/shop/tools"
        : "/shop/equipment",
    backLabel: isMotorcycle
      ? "Motorcycles"
      : equipmentMeta.category === "tools"
        ? "Tools & Maintenance"
        : "Equipment",
  };
}

export function mapGraphqlCardToCatalogProduct(
  product: GraphQLProductCard,
): CatalogProduct {
  const isMotorcycle = isMotorcycleProduct(product.productCategories);
  const isVariable = product.__typename === "VariableProduct";
  const variableProduct = isVariable
    ? (product as GraphQLVariableProduct)
    : null;
  const brand = isMotorcycle
    ? resolveMotorcycleBrand(product.productCategories)
    : resolveEquipmentBrand(product.name, product.attributes);
  const equipmentMeta = isMotorcycle
    ? { gender: "unisex" as const, category: "motorcycles" as const }
    : resolveEquipmentMeta(product.productCategories, product.name);
  const shopAudiences = isMotorcycle
    ? undefined
    : resolveShopAudiences(product.productCategories?.nodes ?? []);
  const image = product.image?.sourceUrl ?? "/brixton-image.webp";
  const price = parseCardPrice(product);
  const colors = variableProduct
    ? colorsFromVariableProduct(variableProduct)
    : [];
  const sizes = variableProduct
    ? sizesFromVariableProduct(variableProduct)
    : ["One size"];
  const variations = variableProduct
    ? mapVariations(variableProduct)
    : undefined;

  return {
    slug: product.slug,
    databaseId: product.databaseId,
    variationIds: variableProduct
      ? variationIdsFromProduct(variableProduct)
      : undefined,
    name: isMotorcycle ? displayName(product.name, brand) : product.name,
    brand,
    price,
    sku: product.sku ?? product.slug,
    image,
    lifestyleImage: image,
    type: isMotorcycle ? "motorcycle" : "equipment",
    gender: equipmentMeta.gender,
    shopAudiences,
    category: equipmentMeta.category,
    sizes: sizes.length > 0 ? sizes : ["One size"],
    colors: colors.length > 0 ? colors : ["—"],
    variations,
    inStock: product.stockStatus === "IN_STOCK",
    isNew: false,
    showroomAvailable: isMotorcycle
      ? resolveShowroomAvailable(product.slug, product.metaData)
      : undefined,
    tagline: "",
    description: "",
    specs: [],
    features: [],
    backHref: isMotorcycle
      ? "/shop/motorcycles"
      : equipmentMeta.category === "tools"
        ? "/shop/tools"
        : "/shop/equipment",
    backLabel: isMotorcycle
      ? "Motorcycles"
      : equipmentMeta.category === "tools"
        ? "Tools & Maintenance"
        : "Equipment",
  };
}

export function isGraphqlMotorcycle(product: GraphQLProduct) {
  return isMotorcycleProduct(product.productCategories);
}
