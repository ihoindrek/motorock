#!/usr/bin/env node
/**
 * Holy Freedom B2B CSV → WooCommerce import CSV (+ optional image download).
 *
 * Usage:
 *   node scripts/holyfreedom-woocommerce-import.mjs \
 *     --input ~/Downloads/249e302591f0af485f80195d9bc89f8561e6dcb7.csv
 *
 * Options:
 *   --input PATH          Source CSV (required)
 *   --output-dir PATH     Default: output/holyfreedom
 *   --limit N             Process only first N product pages (testing)
 *   --no-scrape           Skip holyfreedom.com scraping (CSV data only)
 *   --download-images     Download images locally for WP upload
 *   --delay MS            Delay between scrape requests (default: 900)
 */

import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { basename, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const BRAND = "Holy Freedom";
const DEFAULT_OUTPUT_DIR = "output/holyfreedom";

const CATEGORY_MAP = {
  JACKETS: "Holy Freedom > Jackets",
  "MAN T-SHIRTS": "Holy Freedom > Men > T-Shirts",
  "WOMAN T-SHIRT": "Holy Freedom > Women > T-Shirts",
  "WOMAN SWEATSHIRT": "Holy Freedom > Women > Hoodies",
  TOPWEAR: "Holy Freedom > Topwear",
  PANTS: "Holy Freedom > Pants",
  "MEN GLOVES": "Holy Freedom > Gloves",
  TUBULARS: "Holy Freedom > Accessories > Tubulars",
  SLEEVES: "Holy Freedom > Accessories > Sleeves",
  RINGS: "Holy Freedom > Accessories > Rings",
  HEADWEAR: "Holy Freedom > Accessories > Headwear",
  SWEATSHIRT: "Holy Freedom > Sweatshirts",
  "HANDMADE HELMETS": "Holy Freedom > Helmets > Handmade",
  "STEALTH HOMOLOGATED HELMETS": "Holy Freedom > Helmets > Stealth",
  GIFT: "Holy Freedom > Gifts",
};

const WC_COLUMNS = [
  "Type",
  "SKU",
  "Name",
  "Published",
  "Visibility in catalog",
  "Short description",
  "Description",
  "Tax status",
  "In stock?",
  "Stock",
  "Regular price",
  "Categories",
  "Tags",
  "Images",
  "Parent",
  "Attribute 1 name",
  "Attribute 1 value(s)",
  "Attribute 1 visible",
  "Attribute 1 global",
  "Meta: _cost",
  "Meta: _ean",
  "Meta: _supplier_sku",
  "Meta: brand",
];

function parseArgs(argv) {
  const args = {
    input: "",
    outputDir: DEFAULT_OUTPUT_DIR,
    limit: Infinity,
    scrape: true,
    downloadImages: false,
    delayMs: 900,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") {
      args.input = argv[++i] ?? "";
    } else if (arg === "--output-dir") {
      args.outputDir = argv[++i] ?? DEFAULT_OUTPUT_DIR;
    } else if (arg === "--limit") {
      args.limit = Number(argv[++i] ?? "0");
    } else if (arg === "--no-scrape") {
      args.scrape = false;
    } else if (arg === "--download-images") {
      args.downloadImages = true;
    } else if (arg === "--delay") {
      args.delayMs = Number(argv[++i] ?? "900");
    } else if (arg === "--help" || arg === "-h") {
      console.log(readFileSync(new URL(import.meta.url), "utf8").slice(0, 900));
      process.exit(0);
    }
  }

  if (!args.input) {
    console.error("Missing --input PATH");
    process.exit(1);
  }

  return args;
}

function sleep(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).filter(Boolean).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current);
  return cells;
}

function escapeCsv(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function writeCsv(path, columns, rows) {
  const lines = [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => escapeCsv(row[column] ?? "")).join(",")),
  ];
  writeFileSync(path, `${lines.join("\n")}\n`, "utf8");
}

function baseProductUrl(url) {
  return url.split("#")[0].replace(/#$/, "");
}

function cleanProductName(name) {
  return name.replace(/\s*\((Size|Jeans Size):\s*[^)]+\)\s*$/i, "").trim();
}

function extractSize(row) {
  const size = row.Size?.trim();
  if (size) {
    return size;
  }

  const match =
    row.name.match(/\(Size:\s*([^)]+)\)/i) ??
    row.name.match(/\(Jeans Size:\s*([^)]+)\)/i);
  return match?.[1]?.trim() ?? "";
}

function mapCategory(categoryName) {
  const key = categoryName?.trim();
  if (!key) {
    return BRAND;
  }
  return CATEGORY_MAP[key] ?? `${BRAND} > ${titleCase(key)}`;
}

function titleCase(value) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hashUrl(url) {
  return createHash("sha1").update(url).digest("hex").slice(0, 16);
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(html) {
  return decodeHtml(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** WooCommerce CSV import behaves best with single-line HTML descriptions. */
function formatDescriptionForImport(text) {
  if (!text) {
    return "";
  }

  return text
    .split(/\n\n+/)
    .map((paragraph) =>
      `<p>${paragraph.replace(/\n/g, "<br />").replace(/·/g, "•")}</p>`,
    )
    .join("");
}

function extractImages(html) {
  const urls = [
    ...html.matchAll(
      /content="(https:\/\/www\.holyfreedom\.com\/\d+-large_default\/[^"]+)"/g,
    ),
  ].map((match) => match[1]);
  return [...new Set(urls)];
}

function sanitizeShortDescription(text) {
  let cleaned = text.replace(/\s+/g, " ").trim();
  const trailingCta =
    /[\s,]+(?:Discover|Shop(?:\s+now)?|Learn\s+more|Read\s+more|Avasta|Osta(?:\s+kohe)?|Loe\s+edasi|Lugege\s+edasi|Scopri|Acquista(?:\s+ora)?)\.?$/iu;

  while (trailingCta.test(cleaned)) {
    cleaned = cleaned.replace(trailingCta, "").trim();
  }

  return cleaned.replace(/,\s*$/, "").trim();
}

function extractShortDescription(html) {
  const og = html.match(/property="og:description"\s+content="([^"]+)"/i);
  if (og?.[1]) {
    return sanitizeShortDescription(decodeHtml(og[1]));
  }

  const block = html.match(
    /class="rte-content product-description"[^>]*>([\s\S]*?)<\/div>/i,
  );
  return block
    ? sanitizeShortDescription(stripHtml(block[1]).slice(0, 280))
    : "";
}

function extractDescription(html) {
  const tab = html.match(
    /id="description"[\s\S]*?<div class="product-description">([\s\S]*?)<\/div>\s*<\/div>/i,
  );
  if (tab?.[1]) {
    return stripHtml(tab[1]);
  }
  return extractShortDescription(html);
}

async function scrapeProductPage(url, cacheDir, delayMs) {
  const pageUrl = baseProductUrl(url);
  const cacheFile = join(cacheDir, `${hashUrl(pageUrl)}.json`);

  if (existsSync(cacheFile)) {
    return JSON.parse(readFileSync(cacheFile, "utf8"));
  }

  await sleep(delayMs);
  const response = await fetch(pageUrl, {
    headers: {
      "User-Agent": "MotorockHolyFreedomImport/1.0 (+https://motorock.eu)",
      Accept: "text/html",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${pageUrl}`);
  }

  const html = await response.text();
  const payload = {
    url: pageUrl,
    images: extractImages(html),
    shortDescription: extractShortDescription(html),
    description: extractDescription(html),
  };

  writeFileSync(cacheFile, JSON.stringify(payload, null, 2));
  return payload;
}

async function downloadImage(url, targetPath) {
  if (existsSync(targetPath)) {
    return;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image HTTP ${response.status}: ${url}`);
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(targetPath));
}

async function resolveImages(imageUrls, options) {
  if (!options.downloadImages || imageUrls.length === 0) {
    return imageUrls.join(", ");
  }

  const localPaths = [];
  for (const url of imageUrls) {
    const filename = basename(url);
    const target = join(options.imagesDir, filename);
    await downloadImage(url, target);
    localPaths.push(target);
  }
  return localPaths.join(", ");
}

function groupRows(rows) {
  const simple = [];
  const variableGroups = new Map();

  for (const row of rows) {
    const reference = row.reference?.trim();
    const referenceProduct = row.reference_product?.trim();

    if (referenceProduct) {
      const group = variableGroups.get(referenceProduct) ?? [];
      group.push(row);
      variableGroups.set(referenceProduct, group);
      continue;
    }

    if (reference) {
      simple.push(row);
      continue;
    }

    simple.push({
      ...row,
      reference: row.ean13?.trim() || `HF-${hashUrl(row.product_link).slice(0, 8)}`,
    });
  }

  return { simple, variableGroups };
}

function emptyRow() {
  return Object.fromEntries(WC_COLUMNS.map((column) => [column, ""]));
}

function baseRow(scraped, categoryName, tags = BRAND) {
  const row = emptyRow();
  row.Published = "1";
  row["Visibility in catalog"] = "visible";
  row["Tax status"] = "taxable";
  row.Categories = mapCategory(categoryName);
  row.Tags = tags;
  row["Meta: brand"] = BRAND;
  if (scraped?.shortDescription) {
    row["Short description"] = scraped.shortDescription;
  }
  if (scraped?.description) {
    row.Description = formatDescriptionForImport(scraped.description);
  }
  if (scraped?.images?.length) {
    row.Images = scraped.images.join(", ");
  }
  return row;
}

function sortSizes(sizes) {
  const order = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  return [...new Set(sizes)].sort((left, right) => {
    const leftIndex = order.indexOf(left.toUpperCase());
    const rightIndex = order.indexOf(right.toUpperCase());
    if (leftIndex !== -1 && rightIndex !== -1) {
      return leftIndex - rightIndex;
    }
    if (leftIndex !== -1) {
      return -1;
    }
    if (rightIndex !== -1) {
      return 1;
    }
    return left.localeCompare(right, undefined, { numeric: true });
  });
}

async function buildSimpleRow(row, scraped, imageField) {
  const output = baseRow(scraped, row.category_name);
  output.Type = "simple";
  output.SKU = row.reference.trim();
  output.Name = row.name.trim();
  output["Regular price"] = row.Retail_Price?.trim() ?? "";
  output["Meta: _cost"] = row.Dedicated_Price?.trim() ?? "";
  output["Meta: _ean"] = row.ean13?.trim() ?? "";
  output["Meta: _supplier_sku"] = row.reference.trim();
  output.Stock = row.quantity?.trim() ?? "0";
  output["In stock?"] = Number(output.Stock) > 0 ? "1" : "0";
  output.Images = imageField;
  return output;
}

async function buildVariableRows(parentSku, rows, scraped, imageField) {
  const first = rows[0];
  const parentName = cleanProductName(first.name);
  const sizes = sortSizes(rows.map(extractSize).filter(Boolean));
  const isVariable = sizes.length > 0;

  if (!isVariable) {
    const only = rows[0];
    return [
      await buildSimpleRow(
        {
          ...only,
          reference: parentSku,
          name: parentName,
        },
        scraped,
        imageField,
      ),
    ];
  }

  const parent = baseRow(scraped, first.category_name);
  parent.Type = "variable";
  parent.SKU = parentSku;
  parent.Name = parentName;
  parent["Attribute 1 name"] = "Size";
  parent["Attribute 1 value(s)"] = sizes.join(", ");
  parent["Attribute 1 visible"] = "1";
  parent["Attribute 1 global"] = "1";
  parent.Images = imageField;
  parent["Meta: _supplier_sku"] = parentSku;

  const variations = rows.map((row) => {
    const variation = emptyRow();
    variation.Type = "variation";
    variation.Parent = parentSku;
    variation.SKU = row.ean13?.trim() || `${parentSku}-${extractSize(row)}`;
    variation["Regular price"] = row.Retail_Price?.trim() ?? "";
    variation["Meta: _cost"] = row.Dedicated_Price?.trim() ?? "";
    variation["Meta: _ean"] = row.ean13?.trim() ?? "";
    variation["Meta: _supplier_sku"] = parentSku;
    variation.Stock = row.quantity?.trim() ?? "0";
    variation["In stock?"] = Number(variation.Stock) > 0 ? "1" : "0";
    variation["Attribute 1 name"] = "Size";
    variation["Attribute 1 value(s)"] = extractSize(row);
    variation["Attribute 1 visible"] = "1";
    variation["Attribute 1 global"] = "1";
    return variation;
  });

  return [parent, ...variations];
}

async function main() {
  const args = parseArgs(process.argv);
  const inputPath = resolve(args.input);
  const outputDir = resolve(args.outputDir);
  const cacheDir = join(outputDir, ".cache");
  const imagesDir = join(outputDir, "images");

  mkdirSync(outputDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });
  if (args.downloadImages) {
    mkdirSync(imagesDir, { recursive: true });
  }

  const rows = parseCsv(readFileSync(inputPath, "utf8"));
  const { simple, variableGroups } = groupRows(rows);

  const pageUrls = new Set();
  for (const row of simple) {
    pageUrls.add(baseProductUrl(row.product_link));
  }
  for (const groupRowsList of variableGroups.values()) {
    pageUrls.add(baseProductUrl(groupRowsList[0].product_link));
  }

  const limitedUrls = [...pageUrls].slice(0, args.limit);
  const scrapedByUrl = new Map();
  const scrapeErrors = [];

  if (args.scrape) {
    console.log(`Scraping ${limitedUrls.length} product pages...`);
    for (const [index, url] of limitedUrls.entries()) {
      try {
        const scraped = await scrapeProductPage(url, cacheDir, args.delayMs);
        scrapedByUrl.set(url, scraped);
        process.stdout.write(`  [${index + 1}/${limitedUrls.length}] ${url}\n`);
      } catch (error) {
        scrapeErrors.push({ url, error: error instanceof Error ? error.message : String(error) });
        process.stdout.write(`  [${index + 1}/${limitedUrls.length}] FAILED ${url}\n`);
      }
    }
  }

  const importRows = [];
  const skippedParents = [];

  for (const row of simple) {
    if (!limitedUrls.includes(baseProductUrl(row.product_link))) {
      continue;
    }

    const scraped = scrapedByUrl.get(baseProductUrl(row.product_link));
    const images = await resolveImages(scraped?.images ?? [], {
      downloadImages: args.downloadImages,
      imagesDir,
    });
    importRows.push(await buildSimpleRow(row, scraped, images));
  }

  for (const [parentSku, group] of variableGroups.entries()) {
    const pageUrl = baseProductUrl(group[0].product_link);
    if (!limitedUrls.includes(pageUrl)) {
      skippedParents.push(parentSku);
      continue;
    }

    const scraped = scrapedByUrl.get(pageUrl);
    const images = await resolveImages(scraped?.images ?? [], {
      downloadImages: args.downloadImages,
      imagesDir,
    });
    importRows.push(...(await buildVariableRows(parentSku, group, scraped, images)));
  }

  const csvPath = join(outputDir, "woocommerce-import.csv");
  writeCsv(csvPath, WC_COLUMNS, importRows);

  const summary = {
    sourceRows: rows.length,
    simpleProducts: simple.length,
    variableParents: variableGroups.size,
    scrapedPages: scrapedByUrl.size,
    importRows: importRows.length,
    scrapeErrors,
    skippedParents: args.limit < pageUrls.size ? skippedParents : [],
    output: {
      csv: csvPath,
      cacheDir,
      imagesDir: args.downloadImages ? imagesDir : null,
    },
  };

  writeFileSync(join(outputDir, "import-summary.json"), JSON.stringify(summary, null, 2));

  console.log("\nDone.");
  console.log(`  WooCommerce CSV: ${csvPath}`);
  console.log(`  Import rows:     ${importRows.length}`);
  console.log(`  Scrape errors:   ${scrapeErrors.length}`);
  if (args.limit < pageUrls.size) {
    console.log(`  Note: --limit ${args.limit} — re-run without --limit for all ${pageUrls.size} pages`);
  }
  console.log("\nNext: WooCommerce → Products → Import → upload woocommerce-import.csv");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
