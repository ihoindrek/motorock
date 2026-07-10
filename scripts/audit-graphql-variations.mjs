#!/usr/bin/env node

const graphqlUrl =
  process.env.WOOCOMMERCE_GRAPHQL_URL ??
  process.env.NEXT_PUBLIC_WOOCOMMERCE_GRAPHQL_URL ??
  "https://motorock.eu/graphql";

const storeUrl =
  process.env.WOOCOMMERCE_STORE_URL ??
  process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL ??
  "https://motorock.eu";

const productIds = process.argv.slice(2).map((value) => Number(value)).filter(Boolean);

if (productIds.length === 0) {
  console.error("Usage: node scripts/audit-graphql-variations.mjs <productId> [productId...]");
  console.error("Example: node scripts/audit-graphql-variations.mjs 33817 37309");
  process.exit(1);
}

async function fetchGraphqlVariationCount(productId) {
  const query = `
    query AuditVariations($id: ID!) {
      product(id: $id, idType: DATABASE_ID) {
        databaseId
        name
        ... on VariableProduct {
          variations(first: 100) {
            nodes {
              databaseId
            }
          }
        }
      }
    }
  `;

  const response = await fetch(graphqlUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { id: String(productId) } }),
  });

  const payload = await response.json();
  const product = payload?.data?.product;

  return {
    ok: Boolean(product),
    name: product?.name ?? null,
    count: product?.variations?.nodes?.length ?? 0,
    error: payload?.errors?.[0]?.message ?? null,
  };
}

async function fetchStoreVariationCount(productId) {
  const response = await fetch(
    `${storeUrl.replace(/\/$/, "")}/wp-json/wc/store/v1/products/${productId}`,
  );

  if (!response.ok) {
    return { ok: false, count: 0, error: `HTTP ${response.status}` };
  }

  const product = await response.json();
  return {
    ok: true,
    count: product?.variations?.length ?? 0,
    type: product?.type ?? null,
  };
}

console.log(`GraphQL: ${graphqlUrl}`);
console.log(`Store API: ${storeUrl}\n`);

let failed = false;

for (const productId of productIds) {
  const [graphql, store] = await Promise.all([
    fetchGraphqlVariationCount(productId),
    fetchStoreVariationCount(productId),
  ]);

  const mismatch = store.count > 0 && graphql.count === 0;
  if (mismatch) {
    failed = true;
  }

  console.log(`Product ${productId}${graphql.name ? ` (${graphql.name})` : ""}`);
  console.log(`  Store API variations: ${store.count}${store.error ? ` (${store.error})` : ""}`);
  console.log(
    `  GraphQL variations:   ${graphql.count}${graphql.error ? ` (${graphql.error})` : ""}`,
  );
  console.log(
    mismatch
      ? "  Status: MISMATCH — install wordpress/motorock-headless-graphql.php and re-save the product"
      : graphql.count === store.count
        ? "  Status: OK"
        : "  Status: review manually",
  );
  console.log("");
}

process.exit(failed ? 1 : 0);
