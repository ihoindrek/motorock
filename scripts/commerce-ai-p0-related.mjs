#!/usr/bin/env node
/**
 * P0: backfill AI curated related products (_motorock_related_slugs).
 *
 * Usage:
 *   node scripts/commerce-ai-p0-related.mjs --scan-only --category=for-men --limit=30
 *   node scripts/commerce-ai-p0-related.mjs --dry-run --limit=5
 *   node scripts/commerce-ai-p0-related.mjs --limit=20 --delay-ms=3000
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const RELATED_META = "_motorock_related_slugs";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const raw = readFileSync(path, "utf8");
  const env = {};

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }

  return env;
}

function readMeta(meta, key) {
  return meta?.find((entry) => entry.key === key)?.value ?? "";
}

function hasRelatedSlugs(product) {
  const raw = readMeta(product.metaData, RELATED_META).trim();
  if (!raw) {
    return false;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.filter(Boolean).length >= 3;
  } catch {
    return false;
  }
}

function productCategorySlugs(product) {
  return (product.productCategories?.nodes ?? []).map((node) => node.slug);
}

function isMotorcycleCategoryProduct(product) {
  return (product.productCategories?.nodes ?? []).some(
    (category) =>
      category.slug === "motorcycles" ||
      category.parent?.node?.slug === "motorcycles",
  );
}

function matchesCategory(product, categorySlug) {
  if (!categorySlug) {
    return true;
  }

  if (categorySlug === "motorcycles") {
    return isMotorcycleCategoryProduct(product);
  }

  return productCategorySlugs(product).includes(categorySlug);
}

const CATALOG_QUERY = `
  query RelatedPilotCatalog($first: Int!, $after: String) {
    products(first: $first, after: $after, where: { status: "publish" }) {
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on Product {
          databaseId
          name
          slug
          metaData { key value }
          productCategories {
            nodes {
              slug
              parent { node { slug } }
            }
          }
        }
      }
    }
  }
`;

async function graphql(endpoint, query, variables) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();
  if (!response.ok || json.errors?.length) {
    throw new Error(
      json.errors?.map((error) => error.message).join("; ") ||
        `GraphQL HTTP ${response.status}`,
    );
  }

  return json.data;
}

async function fetchAllProducts(endpoint, maxPages = 20) {
  const products = [];
  let after = null;

  for (let page = 0; page < maxPages; page += 1) {
    const data = await graphql(endpoint, CATALOG_QUERY, { first: 100, after });
    products.push(...data.products.nodes.filter((node) => node?.databaseId));

    if (!data.products.pageInfo.hasNextPage) {
      break;
    }

    after = data.products.pageInfo.endCursor;
  }

  return products;
}

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

async function runRelated(apiUrl, secret, productId, dryRun) {
  const started = Date.now();
  const response = await fetch(`${apiUrl}/api/commerce-ai/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      skill: "catalog.related_products",
      locale: "en",
      target: { productId },
      options: {
        dryRun,
        revalidate: false,
      },
    }),
  });

  const body = await response.json().catch(() => ({}));
  return {
    httpStatus: response.status,
    durationMs: Date.now() - started,
    body,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const scanOnly = args.includes("--scan-only");
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 10;
  const categoryArg = args.find((arg) => arg.startsWith("--category="));
  const category = categoryArg ? categoryArg.split("=")[1] : "";
  const delayArg = args.find((arg) => arg.startsWith("--delay-ms="));
  const delayMs = delayArg ? Number(delayArg.split("=")[1]) : 2500;

  const env = loadEnvLocal();
  const graphqlUrl = env.WOOCOMMERCE_GRAPHQL_URL;
  const apiSecret = env.AI_API_SECRET;
  const apiUrl = env.NEXT_PUBLIC_STOREFRONT_URL || "https://motorock.eu";

  if (!graphqlUrl || !apiSecret) {
    throw new Error("Missing WOOCOMMERCE_GRAPHQL_URL or AI_API_SECRET in .env.local");
  }

  console.log("Scanning catalog for missing AI related products…");
  if (category) {
    console.log(`Category filter: ${category}`);
  }

  const products = await fetchAllProducts(graphqlUrl);
  console.log(`Fetched ${products.length} published products.`);

  const missing = products
    .filter((product) => matchesCategory(product, category))
    .filter((product) => !hasRelatedSlugs(product))
    .slice(0, limit);

  console.log(`\nMissing ${RELATED_META} (${missing.length} selected):`);
  for (const product of missing) {
    console.log(`  #${product.databaseId} ${product.slug}`);
  }

  if (missing.length === 0) {
    console.log("Nothing to backfill.");
    return;
  }

  if (scanOnly) {
    console.log("\nProduct IDs:", missing.map((product) => product.databaseId).join(", "));
    return;
  }

  console.log(`\nRunning catalog.related_products (dryRun=${dryRun})…`);

  const report = {
    startedAt: new Date().toISOString(),
    dryRun,
    productIds: missing.map((product) => product.databaseId),
    runs: [],
  };

  for (let index = 0; index < missing.length; index += 1) {
    const product = missing[index];
    console.log(
      `\n[${index + 1}/${missing.length}] #${product.databaseId} ${product.slug}`,
    );

    try {
      const result = await runRelated(apiUrl, apiSecret, product.databaseId, dryRun);
      const slugs =
        result.body.result?.relatedSlugs ??
        result.body.result?.preview?.relatedSlugs ??
        [];

      report.runs.push({
        productId: product.databaseId,
        slug: product.slug,
        httpStatus: result.httpStatus,
        ok: result.body.ok,
        durationMs: result.durationMs,
        relatedSlugs: slugs,
        error: result.body.error,
      });

      if (!result.body.ok) {
        console.log(`  ✗ ${result.body.error ?? "failed"} (HTTP ${result.httpStatus})`);
      } else {
        console.log(
          `  ✓ ${(result.durationMs / 1000).toFixed(1)}s — [${slugs.join(", ")}]`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`  ✗ ${message}`);
      report.runs.push({
        productId: product.databaseId,
        slug: product.slug,
        error: message,
      });
    }

    if (index < missing.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  report.finishedAt = new Date().toISOString();
  console.log("\n--- JSON report ---");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
