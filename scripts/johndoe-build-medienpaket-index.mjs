#!/usr/bin/env node
/**
 * Build John Doe medienpaket index from local input/ folders.
 *
 * Usage:
 *   node scripts/johndoe-build-medienpaket-index.mjs
 *   node scripts/johndoe-build-medienpaket-index.mjs --input input --output output/johndoe/.cache/medienpaket-index.json
 */

import { resolve } from "node:path";
import { writeMedienpaketIndex } from "./lib/johndoe-medienpaket-index.mjs";

const args = process.argv.slice(2);
let inputDir = "input";
let outputPath = "output/johndoe/.cache/medienpaket-index.json";

for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--input") inputDir = args[++i] ?? inputDir;
  else if (args[i] === "--output") outputPath = args[++i] ?? outputPath;
}

const built = writeMedienpaketIndex(resolve(inputDir), resolve(outputPath));

console.log("Medienpaket index built.");
console.log(`  Products: ${built.products.length}`);
console.log(`  Index keys: ${Object.keys(built.index).length}`);
console.log(`  Output: ${resolve(outputPath)}`);

for (const product of built.products) {
  console.log(
    `  ${product.sku} — ${product.images.length} image(s)${product.videoUrl ? ", video" : ""}`,
  );
}
