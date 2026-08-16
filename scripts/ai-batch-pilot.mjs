#!/usr/bin/env node
/**
 * Pilot: find weak-content products and run AI batch in small chunks.
 * Usage:
 *   node scripts/ai-batch-pilot.mjs --scan-only --category=motorcycles --gap=seo --limit=30
 *   node scripts/ai-batch-pilot.mjs [--dry-run] [--limit=8] [--category=motorcycles]
 *   node scripts/ai-batch-pilot.mjs --sections=description,seo,faq,alt_text --limit=12
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

function stripHtml(html) {
  return (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readMeta(meta, key) {
  return meta?.find((entry) => entry.key === key)?.value ?? "";
}

function parseFaq(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function contentScore(product) {
  const shortPlain = stripHtml(product.shortDescription);
  const longPlain = stripHtml(product.description);
  const seoTitle = readMeta(product.metaData, "_motorock_ai_seo_title");
  const seoMeta = readMeta(
    product.metaData,
    "_motorock_ai_seo_meta_description",
  );
  const faq = parseFaq(readMeta(product.metaData, "_motorock_ai_faq"));
  const aiStatus = readMeta(product.metaData, "_motorock_ai_content_status");

  let score = 0;
  const gaps = [];

  if (shortPlain.length < 40 || longPlain.length < 200) {
    score += 3;
    gaps.push("description");
  } else if (longPlain.length < 400) {
    score += 1;
    gaps.push("description-weak");
  }

  if (!seoTitle.trim() || !seoMeta.trim() || seoMeta.trim().length < 80) {
    score += 2;
    gaps.push("seo");
  }

  if (faq.length < 3) {
    score += 1;
    gaps.push("faq");
  }

  if (aiStatus === "draft") {
    score += 0.5;
    gaps.push("draft-pending");
  }

  return { score, gaps };
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

function matchesGapFilter(gaps, gapFilter) {
  if (!gapFilter) {
    return true;
  }

  return gaps.includes(gapFilter);
}

const CATALOG_QUERY = `
  query AiPilotCatalog($first: Int!, $after: String) {
    products(first: $first, after: $after, where: { status: "publish" }) {
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on Product {
          databaseId
          name
          slug
          shortDescription
          description
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
      json.errors?.map((e) => e.message).join("; ") ||
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

    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }

  return products;
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function runBatch(apiUrl, secret, productIds, options) {
  const started = Date.now();
  const response = await fetch(`${apiUrl}/api/ai/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      productIds,
      locales: ["en", "et"],
      sections: options.sections,
      options: {
        dryRun: options.dryRun,
        overwrite: "always",
        publishStatus: "draft",
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

function summarizeJob(job) {
  if (!job.ok && job.error) {
    return {
      productId: job.productId,
      locale: job.locale,
      ok: false,
      error: job.error,
      code: job.code,
    };
  }

  return {
    productId: job.productId,
    locale: job.locale,
    ok: job.ok,
    durationMs: job.durationMs,
    sections: (job.results ?? []).map((r) => ({
      section: r.section,
      status: r.status,
      message: r.message,
    })),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const scanOnly = args.includes("--scan-only");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 8;
  const chunkSizeArg = args.find((a) => a.startsWith("--chunk="));
  const chunkSize = chunkSizeArg ? Number(chunkSizeArg.split("=")[1]) : 2;
  const categoryArg = args.find((a) => a.startsWith("--category="));
  const category = categoryArg ? categoryArg.split("=")[1] : "";
  const gapArg = args.find((a) => a.startsWith("--gap="));
  const gapFilter = gapArg ? gapArg.split("=")[1] : "";
  const sectionsArg = args.find((a) => a.startsWith("--sections="));
  const sections = sectionsArg
    ? sectionsArg
        .split("=")[1]
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : ["description", "seo", "faq"];

  const env = loadEnvLocal();
  const graphqlUrl = env.WOOCOMMERCE_GRAPHQL_URL;
  const apiSecret = env.AI_API_SECRET;
  const apiUrl = env.NEXT_PUBLIC_STOREFRONT_URL || "https://motorock.eu";

  if (!graphqlUrl || !apiSecret) {
    throw new Error("Missing WOOCOMMERCE_GRAPHQL_URL or AI_API_SECRET in .env.local");
  }

  console.log("Scanning catalog for weak AI content…");
  if (category) {
    console.log(`Category filter: ${category}`);
  }
  if (gapFilter) {
    console.log(`Gap filter: ${gapFilter}`);
  }

  const products = await fetchAllProducts(graphqlUrl);
  console.log(`Fetched ${products.length} published products.`);

  const ranked = products
    .filter((product) => matchesCategory(product, category))
    .map((product) => {
      const { score, gaps } = contentScore(product);
      return { product, score, gaps };
    })
    .filter(({ score, gaps }) => score > 0 && matchesGapFilter(gaps, gapFilter))
    .sort((a, b) => b.score - a.score);

  const selected = ranked.slice(0, limit);

  console.log(`\nWeak-content products (${selected.length} shown, ${ranked.length} total matches):`);
  for (const { product, score, gaps } of selected) {
    console.log(
      `  #${product.databaseId} ${product.slug} (score=${score}) gaps=[${gaps.join(", ")}]`,
    );
  }

  if (selected.length === 0) {
    console.log("No matching products found.");
    return;
  }

  if (scanOnly) {
    console.log("\nProduct IDs:", selected.map(({ product }) => product.databaseId).join(", "));
    return;
  }

  const productIds = selected.map(({ product }) => product.databaseId);
  const chunks = chunk(productIds, chunkSize);

  console.log(
    `\nRunning ${chunks.length} batch chunk(s) × ${chunkSize} products (dryRun=${dryRun}, sections=${sections.join(",")})…`,
  );

  const report = {
    startedAt: new Date().toISOString(),
    dryRun,
    chunkSize,
    productIds,
    chunks: [],
  };

  for (let index = 0; index < chunks.length; index += 1) {
    const ids = chunks[index];
    console.log(`\nChunk ${index + 1}/${chunks.length}: [${ids.join(", ")}]`);

    try {
      const result = await runBatch(apiUrl, apiSecret, ids, { dryRun, sections });
      const chunkReport = {
        productIds: ids,
        httpStatus: result.httpStatus,
        durationMs: result.durationMs,
        batch: {
          ok: result.body.ok,
          batchId: result.body.batchId,
          total: result.body.total,
          succeeded: result.body.succeeded,
          failed: result.body.failed,
          durationMs: result.body.durationMs,
        },
        jobs: (result.body.jobs ?? []).map(summarizeJob),
        rawError: result.body.error,
      };

      report.chunks.push(chunkReport);

      console.log(
        `  HTTP ${result.httpStatus} in ${(result.durationMs / 1000).toFixed(1)}s — succeeded ${result.body.succeeded ?? "?"}/${result.body.total ?? "?"} failed ${result.body.failed ?? "?"}`,
      );

      for (const job of chunkReport.jobs) {
        if (!job.ok) {
          console.log(`  ✗ #${job.productId} ${job.locale}: ${job.error}`);
          continue;
        }
        const sections = job.sections
          ?.map((s) => `${s.section}:${s.status}`)
          .join(", ");
        console.log(`  ✓ #${job.productId} ${job.locale} (${sections})`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  Chunk failed: ${message}`);
      report.chunks.push({ productIds: ids, error: message });
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
