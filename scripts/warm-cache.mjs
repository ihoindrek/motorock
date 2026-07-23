#!/usr/bin/env node
/**
 * Warms the ISR/CDN cache after a deploy by requesting every sitemap URL.
 * Each new deployment starts with an empty route cache, so without warming
 * the first visitor of every page pays the full server render (~5-7s on
 * product pages). Usage: node scripts/warm-cache.mjs [baseUrl]
 */

const base = (process.argv[2] ?? "https://motorock.eu").replace(/\/$/, "");
// Each page fans out into several sequential WooCommerce GraphQL calls, so
// keep concurrency low — too many parallel cold renders overwhelm the WP
// backend and pages start timing out.
const CONCURRENCY = Number(process.env.WARM_CONCURRENCY ?? 4);
const REQUEST_TIMEOUT_MS = 45_000;

async function fetchText(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`${url} -> HTTP ${response.status}`);
  }
  return response.text();
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

async function collectUrls() {
  const index = await fetchText(`${base}/sitemap.xml`);
  const locs = extractLocs(index);
  const sitemaps = locs.filter((loc) => loc.endsWith(".xml"));

  if (sitemaps.length === 0) {
    return locs;
  }

  const nested = await Promise.all(sitemaps.map(fetchText));
  return nested.flatMap(extractLocs);
}

async function warm(url) {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { "user-agent": "motorock-cache-warmer" },
    });
    await response.arrayBuffer();
    return {
      url,
      status: response.status,
      cache: response.headers.get("x-vercel-cache") ?? "?",
      ms: Date.now() - started,
    };
  } catch (error) {
    return { url, status: 0, cache: String(error), ms: Date.now() - started };
  }
}

const urls = [...new Set(await collectUrls())].map((url) =>
  url.replace(/^https?:\/\/[^/]+/, base),
);
console.log(`Warming ${urls.length} URLs on ${base}`);

const started = Date.now();
const results = [];
const queue = [...urls];

await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      results.push(await warm(url));
    }
  }),
);

const failed = results.filter((result) => result.status !== 200);
const misses = results.filter((result) => result.cache === "MISS");
const slow = [...results].sort((a, b) => b.ms - a.ms).slice(0, 5);

console.log(`Done in ${Math.round((Date.now() - started) / 1000)}s`);
console.log(`Rendered fresh (MISS): ${misses.length}, failed: ${failed.length}`);
console.log("Slowest:");
for (const result of slow) {
  console.log(`  ${result.ms}ms ${result.cache} ${result.url}`);
}
for (const result of failed.slice(0, 10)) {
  console.log(`FAILED ${result.status} ${result.url} ${result.cache}`);
}

if (failed.length > urls.length / 10) {
  process.exit(1);
}
