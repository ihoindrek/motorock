#!/usr/bin/env node
/**
 * John Doe stock CSV → WooCommerce import CSV.
 *
 * Pricing: VK_Brutto (retail). Cost: EK_Netto.
 * Enrichment: Parts Europe product pages when a vendor part match is found.
 *
 * Usage:
 *   node scripts/johndoe-woocommerce-import.mjs --fetch
 *   node scripts/johndoe-woocommerce-import.mjs --input ~/Downloads/jd-stock.csv
 *
 * Options:
 *   --fetch               Download from John Doe stock export URL
 *   --input PATH          Local semicolon CSV (required unless --fetch)
 *   --url URL             Override stock CSV URL
 *   --output-dir PATH     Default: output/johndoe
 *   --limit N             Process only first N parent products (testing)
 *   --no-scrape           Skip Parts Europe enrichment
 *   --build-pe-index      Crawl Parts Europe John Doe brand pages into cache
 *   --with-images-only    Import only parent products with Parts Europe images
 *   --delay MS            Delay between HTTP requests (default: 800)
 */

import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const BRAND = "John Doe";
const DEFAULT_OUTPUT_DIR = "output/johndoe";
const DEFAULT_STOCK_URL =
  "https://portal.ridejohndoe.com/stocklist/export_csv_with_outside_warehouse";
const PE_BRAND_URL = "https://www.partseurope.eu/en/brands/john-doe";

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
  "Meta: _jd_inside_stock",
  "Meta: _jd_outside_stock",
  "Meta: brand",
];

const SIZE_SUFFIX =
  /^(.+)-(XS|S|M|L|XL|2XL|3XL|4XL|5XL|6XL|XXL|XXXL|\d{2}(?:\.\d)?)$/i;
const WAIST_INSEAM_SUFFIX = /^(.+)-(\d{2}\/\d{2}(?:-[A-Z0-9]+)?)$/i;

const CATEGORY_RULES = [
  [/jacket|motoshirt|shirt|hoodie|sweat|vest|blouson|windblock|flannel/i, "Jackets"],
  [/pant|jean|cargo|chino|stroker|ironhead|explorer/i, "Pants"],
  [/glove/i, "Gloves"],
  [/boot|shoe|sneaker|shifter|neo/i, "Footwear"],
  [/protector|protect/i, "Protection"],
  [/helmet|goggle|mask|hat|trucker|cap|tube|sock|belt|wallet|bag/i, "Accessories"],
];

function parseArgs(argv) {
  const args = {
    input: "",
    fetch: false,
    url: DEFAULT_STOCK_URL,
    outputDir: DEFAULT_OUTPUT_DIR,
    limit: Infinity,
    scrape: true,
    buildPeIndex: false,
    withImagesOnly: false,
    delayMs: 800,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") args.input = argv[++i] ?? "";
    else if (arg === "--fetch") args.fetch = true;
    else if (arg === "--url") args.url = argv[++i] ?? DEFAULT_STOCK_URL;
    else if (arg === "--output-dir") args.outputDir = argv[++i] ?? DEFAULT_OUTPUT_DIR;
    else if (arg === "--limit") args.limit = Number(argv[++i] ?? "0");
    else if (arg === "--no-scrape") args.scrape = false;
    else if (arg === "--build-pe-index") args.buildPeIndex = true;
    else if (arg === "--with-images-only") args.withImagesOnly = true;
    else if (arg === "--delay") args.delayMs = Number(argv[++i] ?? "800");
    else if (arg === "--help" || arg === "-h") {
      console.log("See script header for usage.");
      process.exit(0);
    }
  }

  if (!args.fetch && !args.input) {
    console.error("Provide --fetch or --input PATH");
    process.exit(1);
  }

  return args;
}

function sleep(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function hashKey(value) {
  return createHash("sha1").update(value).digest("hex").slice(0, 16);
}

function parseDecimal(value) {
  const normalized = String(value ?? "")
    .trim()
    .replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseSemicolonCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const headers = splitCsvLine(lines[0], ";");
  return lines.slice(1).filter(Boolean).map((line) => {
    const values = splitCsvLine(line, ";");
    return Object.fromEntries(
      headers.map((header, index) => [header.trim(), (values[index] ?? "").trim()]),
    );
  });
}

function splitCsvLine(line, delimiter) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.replace(/^"|"$/g, "").replace(/""/g, '"'));
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

function splitParentSku(artNr) {
  const trimmed = artNr.trim();
  const letterMatch = SIZE_SUFFIX.exec(trimmed);
  if (letterMatch) {
    return { parentSku: letterMatch[1], size: letterMatch[2].toUpperCase() };
  }

  const waistMatch = WAIST_INSEAM_SUFFIX.exec(trimmed);
  if (waistMatch) {
    return { parentSku: waistMatch[1], size: waistMatch[2] };
  }

  return { parentSku: trimmed, size: "" };
}

function inferCategory(name) {
  for (const [pattern, category] of CATEGORY_RULES) {
    if (pattern.test(name)) {
      return `${BRAND} > ${category}`;
    }
  }
  return BRAND;
}

function sortSizes(sizes) {
  const order = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL", "XXL", "XXXL"];
  return [...new Set(sizes)].sort((left, right) => {
    const leftUpper = left.toUpperCase();
    const rightUpper = right.toUpperCase();
    const leftIndex = order.indexOf(leftUpper);
    const rightIndex = order.indexOf(rightUpper);
    if (leftIndex !== -1 && rightIndex !== -1) return leftIndex - rightIndex;
    if (leftIndex !== -1) return -1;
    if (rightIndex !== -1) return 1;

    const leftWaist = left.match(/^(\d{2})\/(\d{2})/);
    const rightWaist = right.match(/^(\d{2})\/(\d{2})/);
    if (leftWaist && rightWaist) {
      const waistDiff = Number(leftWaist[1]) - Number(rightWaist[1]);
      if (waistDiff !== 0) return waistDiff;
      return Number(leftWaist[2]) - Number(rightWaist[2]);
    }

    return left.localeCompare(right, undefined, { numeric: true });
  });
}

function stockTotals(row) {
  const inside = Number.parseInt(row.Inside_Warehouse ?? "0", 10) || 0;
  const outside = Number.parseInt(row.Outside_Warehouse ?? "0", 10) || 0;
  return { inside, outside, total: inside + outside };
}

function groupRows(rows) {
  const simple = [];
  const groups = new Map();

  for (const row of rows) {
    const artNr = row.ArtNr?.trim();
    if (!artNr) continue;

    const { parentSku, size } = splitParentSku(artNr);
    if (!size) {
      simple.push({ ...row, _parentSku: artNr, _size: "" });
      continue;
    }

    const key = parentSku;
    const group = groups.get(key) ?? [];
    group.push({ ...row, _parentSku: parentSku, _size: size });
    groups.set(key, group);
  }

  return { simple, groups };
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function formatDescriptionForImport(text) {
  if (!text) return "";
  return `<p>${text.replace(/\s+/g, " ").trim()}</p>`;
}

function extractPeProductLinks(html) {
  return [
    ...new Set(
      [...html.matchAll(/href="(\/en\/product\/[^"]+)"/g)].map((match) => match[1]),
    ),
  ];
}

function extractPeVendorParts(html) {
  return [...html.matchAll(/item-part-number[^>]*>\s*([^<]+)/gi)]
    .flatMap((match) =>
      match[1]
        .split("/")
        .map((part) => part.trim())
        .filter(Boolean),
    );
}

function extractPeContent(html) {
  const ogImage = html.match(/property="og:image"\s+content="([^"]+)"/i)?.[1] ?? "";
  const ogDescription = html.match(/property="og:description"\s+content="([^"]+)"/i)?.[1] ?? "";
  const vendorParts = extractPeVendorParts(html);

  return {
    images: ogImage ? [ogImage] : [],
    shortDescription: decodeHtml(ogDescription).slice(0, 280),
    description: decodeHtml(ogDescription),
    vendorParts,
  };
}

async function fetchText(url, delayMs) {
  await sleep(delayMs);
  const response = await fetch(url, {
    headers: {
      "User-Agent": "MotorockJohnDoeImport/1.0 (+https://motorock.eu)",
      Accept: "text/html,text/csv,*/*",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

async function buildPartsEuropeIndex(cacheDir, delayMs) {
  const indexPath = join(cacheDir, "partseurope-index.json");
  if (existsSync(indexPath)) {
    return JSON.parse(readFileSync(indexPath, "utf8"));
  }

  const index = {};
  const productPaths = new Set();

  for (let page = 1; page <= 30; page += 1) {
    let html;
    try {
      html = await fetchText(`${PE_BRAND_URL}?page=${page}`, delayMs);
    } catch {
      break;
    }
    const links = extractPeProductLinks(html);
    if (links.length === 0) break;
    for (const link of links) productPaths.add(link);
    process.stdout.write(`  PE brand page ${page}: ${links.length} links\n`);
  }

  let count = 0;
  for (const path of productPaths) {
    count += 1;
    const url = `https://www.partseurope.eu${path}`;
    try {
      const html = await fetchText(url, delayMs);
      const content = extractPeContent(html);
      for (const part of content.vendorParts) {
        index[part.toUpperCase()] = { url, ...content };
      }
      if (count % 25 === 0) {
        process.stdout.write(`  indexed ${count}/${productPaths.size} PE pages\n`);
      }
    } catch (error) {
      process.stdout.write(`  PE skip ${url}: ${error instanceof Error ? error.message : error}\n`);
    }
  }

  writeFileSync(indexPath, JSON.stringify(index, null, 2));
  return index;
}

function lookupPeContent(index, artNr, parentSku) {
  const keys = [artNr, parentSku].filter(Boolean).map((key) => key.toUpperCase());
  for (const key of keys) {
    if (index[key]) return index[key];
  }

  for (const [indexedPart, payload] of Object.entries(index)) {
    if (keys.some((key) => indexedPart.startsWith(key) || key.startsWith(indexedPart))) {
      return payload;
    }
  }

  return null;
}

function emptyRow() {
  return Object.fromEntries(WC_COLUMNS.map((column) => [column, ""]));
}

function baseRow(enriched, category, tags = BRAND) {
  const row = emptyRow();
  row.Published = "1";
  row["Visibility in catalog"] = "visible";
  row["Tax status"] = "taxable";
  row.Categories = category;
  row.Tags = tags;
  row["Meta: brand"] = BRAND;
  if (enriched?.shortDescription) row["Short description"] = enriched.shortDescription;
  if (enriched?.description) row.Description = formatDescriptionForImport(enriched.description);
  if (enriched?.images?.length) row.Images = enriched.images.join(", ");
  return row;
}

function buildSimpleImportRow(row, enriched) {
  const sku = row.ArtNr.trim();
  const { inside, outside, total } = stockTotals(row);
  const output = baseRow(enriched, inferCategory(row.Bezeichnung));
  output.Type = "simple";
  output.SKU = sku;
  output.Name = row.Bezeichnung.trim();
  output["Regular price"] = parseDecimal(row.VK_Brutto).toFixed(2);
  output["Meta: _cost"] = parseDecimal(row.EK_Netto).toFixed(2);
  output["Meta: _ean"] = row.Barcode?.trim() ?? "";
  output["Meta: _supplier_sku"] = sku;
  output["Meta: _jd_inside_stock"] = String(inside);
  output["Meta: _jd_outside_stock"] = String(outside);
  output.Stock = String(total);
  output["In stock?"] = total > 0 ? "1" : "0";
  return output;
}

function buildVariableImportRows(parentSku, rows, enriched) {
  const first = rows[0];
  const sizes = sortSizes(rows.map((row) => row._size).filter(Boolean));

  if (sizes.length <= 1) {
    return [buildSimpleImportRow(first, enriched)];
  }

  const parent = baseRow(enriched, inferCategory(first.Bezeichnung));
  parent.Type = "variable";
  parent.SKU = parentSku;
  parent.Name = first.Bezeichnung.trim();
  parent["Attribute 1 name"] = "Size";
  parent["Attribute 1 value(s)"] = sizes.join(", ");
  parent["Attribute 1 visible"] = "1";
  parent["Attribute 1 global"] = "1";
  parent["Meta: _supplier_sku"] = parentSku;

  const variations = rows.map((row) => {
    const { inside, outside, total } = stockTotals(row);
    const variation = emptyRow();
    variation.Type = "variation";
    variation.Parent = parentSku;
    variation.SKU = row.ArtNr.trim();
    variation["Regular price"] = parseDecimal(row.VK_Brutto).toFixed(2);
    variation["Meta: _cost"] = parseDecimal(row.EK_Netto).toFixed(2);
    variation["Meta: _ean"] = row.Barcode?.trim() ?? "";
    variation["Meta: _supplier_sku"] = parentSku;
    variation["Meta: _jd_inside_stock"] = String(inside);
    variation["Meta: _jd_outside_stock"] = String(outside);
    variation.Stock = String(total);
    variation["In stock?"] = total > 0 ? "1" : "0";
    variation["Attribute 1 name"] = "Size";
    variation["Attribute 1 value(s)"] = row._size;
    variation["Attribute 1 visible"] = "1";
    variation["Attribute 1 global"] = "1";
    return variation;
  });

  return [parent, ...variations];
}

async function main() {
  const args = parseArgs(process.argv);
  const outputDir = resolve(args.outputDir);
  const cacheDir = join(outputDir, ".cache");
  mkdirSync(outputDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });

  let csvText;
  if (args.fetch) {
    console.log(`Downloading stock CSV from ${args.url}`);
    csvText = await fetchText(args.url, 0);
    writeFileSync(join(outputDir, "source-stock.csv"), csvText, "utf8");
  } else {
    csvText = readFileSync(resolve(args.input), "utf8");
  }

  const rows = parseSemicolonCsv(csvText);
  const { simple, groups } = groupRows(rows);

  let peIndex = {};
  if (args.scrape) {
    if (args.buildPeIndex) {
      console.log("Building Parts Europe index (one-time, cached)...");
      peIndex = await buildPartsEuropeIndex(cacheDir, args.delayMs);
    } else {
      const indexPath = join(cacheDir, "partseurope-index.json");
      if (existsSync(indexPath)) {
        peIndex = JSON.parse(readFileSync(indexPath, "utf8"));
        console.log(`Loaded Parts Europe index (${Object.keys(peIndex).length} vendor parts)`);
      } else {
        console.log("No PE index cache — run with --build-pe-index for images/descriptions.");
      }
    }
  }

  const importRows = [];
  const parents = [
    ...simple.map((row) => ({ type: "simple", key: row._parentSku, rows: [row] })),
    ...[...groups.entries()].map(([key, groupRowsList]) => ({
      type: "variable",
      key,
      rows: groupRowsList,
    })),
  ].slice(0, args.limit);

  let enrichedCount = 0;
  let skippedNoImage = 0;
  let includedParents = 0;
  for (const parent of parents) {
    const enriched = args.scrape
      ? lookupPeContent(peIndex, parent.rows[0].ArtNr, parent.key)
      : null;
    const hasImages = Boolean(enriched?.images?.length);
    if (hasImages) enrichedCount += 1;

    if (args.withImagesOnly && !hasImages) {
      skippedNoImage += 1;
      continue;
    }

    includedParents += 1;
    if (parent.type === "simple") {
      importRows.push(buildSimpleImportRow(parent.rows[0], enriched));
    } else {
      importRows.push(...buildVariableImportRows(parent.key, parent.rows, enriched));
    }
  }

  const csvName = args.withImagesOnly
    ? "woocommerce-import-with-images.csv"
    : "woocommerce-import.csv";
  const csvPath = join(outputDir, csvName);
  writeCsv(csvPath, WC_COLUMNS, importRows);

  const summary = {
    sourceRows: rows.length,
    parentProducts: parents.length,
    includedParents,
    skippedNoImage: args.withImagesOnly ? skippedNoImage : 0,
    importRows: importRows.length,
    enrichedFromPartsEurope: enrichedCount,
    withImagesOnly: args.withImagesOnly,
    simpleProducts: simple.length,
    variableParents: groups.size,
    output: { csv: csvPath, cacheDir },
  };

  writeFileSync(join(outputDir, "import-summary.json"), JSON.stringify(summary, null, 2));

  console.log("\nDone.");
  console.log(`  WooCommerce CSV: ${csvPath}`);
  console.log(`  Parent products: ${parents.length}`);
  if (args.withImagesOnly) {
    console.log(`  With images:     ${includedParents} (${skippedNoImage} skipped)`);
  }
  console.log(`  Import rows:     ${importRows.length}`);
  console.log(`  PE enriched:     ${enrichedCount}`);
  if (args.scrape && !args.buildPeIndex && enrichedCount === 0) {
    console.log("\n  Tip: run once with --build-pe-index to fetch images/descriptions from Parts Europe.");
  }
  console.log("\nNext: WooCommerce → Products → Import → upload woocommerce-import.csv");
  console.log("  Or: WP Admin → Catalog Import → John Doe feed → upload source-stock.csv");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
