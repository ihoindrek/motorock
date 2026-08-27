process.env.WOOCOMMERCE_GRAPHQL_URL ??= "https://shop.motorock.eu/graphql";

const slug = process.argv[2] ?? "johnny-reb-womens-springbrook-leather-vest";

const { getProductBySlug } = await import("../src/lib/graphql/products.ts");
const { mapGraphqlToCatalogProduct } = await import(
  "../src/lib/graphql/map-graphql-product.ts"
);
const { buildSizeGuideRegistry } = await import(
  "../src/lib/shop/size-guide-registry.ts"
);
const { resolveSizeGuide } = await import("../src/lib/shop/resolve-size-guide.ts");
const { remoteSizeGuidesResponseSchema, parseRemoteSizeGuide } = await import(
  "../src/lib/shop/parse-size-guide.ts"
);

const gql = await getProductBySlug(slug, "en");
if (!gql) {
  console.log("product not found");
  process.exit(1);
}

const product = mapGraphqlToCatalogProduct(gql, "en");
console.log({
  slug: product.slug,
  type: product.type,
  gender: product.gender,
  category: product.category,
  brand: product.brand,
  sizes: product.sizes,
  sizeGuideSlug: product.sizeGuideSlug,
});

const response = await fetch(
  "https://shop.motorock.eu/wp-json/motorock/v1/size-guides",
);
const payload = await response.json();
const parsed = remoteSizeGuidesResponseSchema.safeParse(payload);
console.log("rest schema ok", parsed.success);
if (!parsed.success) {
  console.log(parsed.error.issues.slice(0, 3));
  process.exit(1);
}

const guides = parsed.data.guides
  .map(parseRemoteSizeGuide)
  .filter(Boolean);
const registry = buildSizeGuideRegistry(guides);
console.log("registry slugs", Object.keys(registry.bySlug));
const guide = resolveSizeGuide(product, registry);
console.log("resolved", guide?.title ?? "NULL");
