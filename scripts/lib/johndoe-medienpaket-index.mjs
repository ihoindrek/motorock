import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov", ".m4v"]);
const SKIP_IMAGE_PATTERN =
  /lieferumfang|tech_|lifestyle|detail_|sizechart|size_chart|measurement|maß|mass/i;

/** Medienpaket folder SKU → stock CSV ArtNr / parent SKU */
export const MEDIENPAKET_SKU_ALIASES = {
  "XTM-103-1": ["A-H-B-1"],
  "XTM-132-1": ["A-SEK-B-1"],
};

const PRODUCT_FOLDER = /^(?!0[0-9]_)[A-Z0-9-]+_/;

function readWeblocUrl(path) {
  try {
    const xml = readFileSync(path, "utf8");
    const match = xml.match(/<string>(https?:\/\/[^<]+)<\/string>/i);
    return match?.[1]?.trim() ?? "";
  } catch {
    return "";
  }
}

function normalizeVideoUrl(url) {
  const value = url.trim();
  if (!value) return "";
  const youtube = value.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i,
  );
  if (youtube) return `https://www.youtube.com/watch?v=${youtube[1]}`;
  const vimeo = value.match(/(?:vimeo\.com\/(?:video\/)?)(\d+)/i);
  if (vimeo) return `https://vimeo.com/${vimeo[1]}`;
  return value;
}

function listFilesRecursive(dir) {
  const files = [];
  if (!existsSync(dir)) return files;

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      files.push(...listFilesRecursive(path));
      continue;
    }
    files.push(path);
  }

  return files;
}

function scoreWebshopImage(filePath) {
  const name = basename(filePath);
  let score = 0;
  if (/freisteller/i.test(name)) score += 100;
  if (/^01[_-]/i.test(name)) score += 50;
  if (/^02[_-]/i.test(name)) score += 40;
  if (/_HR\.(png|jpg|jpeg|webp)$/i.test(name)) score += 20;
  if (/\/EN\//i.test(filePath)) score += 10;
  if (SKIP_IMAGE_PATTERN.test(name)) score -= 200;
  return score;
}

function collectWebshopImages(productDir, inputRoot) {
  const sourceDirs = [
    join(productDir, "04_Webshop"),
    join(productDir, "04_WebShop"),
    join(productDir, "05_HighRes"),
    join(productDir, "EN"),
    join(productDir, "DE"),
    join(productDir, "FR"),
    join(productDir, "ES"),
    join(productDir, "IT"),
    join(productDir, "US"),
  ].filter((dir) => existsSync(dir));

  const candidates = sourceDirs
    .flatMap((dir) => listFilesRecursive(dir))
    .filter((path) => IMAGE_EXT.has(extname(path).toLowerCase()))
    .filter((path) => !SKIP_IMAGE_PATTERN.test(basename(path)))
    .sort((left, right) => scoreWebshopImage(right) - scoreWebshopImage(left));

  const seen = new Set();
  const images = [];

  for (const path of candidates) {
    const key = basename(path);
    if (seen.has(key)) continue;
    seen.add(key);
    images.push(relative(inputRoot, path).replace(/\\/g, "/"));
    if (images.length >= 6) break;
  }

  return images;
}

function collectVideoUrl(productDir) {
  const videoRoot = join(productDir, "03_Video");
  if (!existsSync(videoRoot)) return "";

  const files = listFilesRecursive(videoRoot).sort((left, right) => {
    const score = (path) => {
      let value = 0;
      if (/01_product_video/i.test(path)) value += 100;
      if (/02_function_video/i.test(path)) value -= 10;
      if (path.endsWith(".webloc")) value += 5;
      return value;
    };
    return score(right) - score(left);
  });

  for (const path of files) {
    if (path.endsWith(".webloc")) {
      const url = normalizeVideoUrl(readWeblocUrl(path));
      if (url) return url;
    }
    if (VIDEO_EXT.has(extname(path).toLowerCase())) {
      return relative(inputRoot, path).replace(/\\/g, "/");
    }
  }

  return "";
}

function resolveIndexKeys(folderName, sku) {
  const keys = new Set([sku.toUpperCase()]);

  for (const alias of MEDIENPAKET_SKU_ALIASES[sku] ?? []) {
    keys.add(alias.toUpperCase());
  }

  if (folderName.includes("Back_LVL1")) {
    keys.add("XTM-150");
    keys.add("A-CB-L-1");
  } else if (folderName.includes("Back_LVL2")) {
    keys.add("XTM-150-2");
    keys.add("A-CB-L-2");
  }

  return [...keys];
}

function findProductDirs(inputRoot) {
  const dirs = new Set();

  for (const path of listFilesRecursive(inputRoot)) {
    const parts = relative(inputRoot, path).split(/[\\/]/);
    for (const part of parts) {
      if (!PRODUCT_FOLDER.test(part) || part.startsWith("ridejohndoe_")) {
        continue;
      }
      const index = parts.indexOf(part);
      dirs.add(join(inputRoot, ...parts.slice(0, index + 1)));
    }
  }

  for (const entry of readdirSync(inputRoot)) {
    const path = join(inputRoot, entry);
    if (!statSync(path).isDirectory()) continue;
    if (!PRODUCT_FOLDER.test(entry)) continue;
    dirs.add(path);
  }

  return [...dirs].sort();
}

export function buildMedienpaketIndex(inputRoot) {
  const index = {};
  const products = [];

  for (const productDir of findProductDirs(inputRoot)) {
    const folderName = basename(productDir);
    const skuMatch = folderName.match(/^([A-Z0-9-]+)_/);
    if (!skuMatch) continue;

    const sku = skuMatch[1];
    const images = collectWebshopImages(productDir, inputRoot);
    const videoUrl = collectVideoUrl(productDir);
    if (images.length === 0 && !videoUrl) continue;

    const payload = {
      sku,
      folder: folderName,
      images,
      videoUrl,
      keys: resolveIndexKeys(folderName, sku),
    };

    products.push(payload);

    for (const key of payload.keys) {
      index[key] = {
        sku: payload.sku,
        folder: payload.folder,
        images: payload.images,
        videoUrl: payload.videoUrl,
      };
    }
  }

  return { index, products };
}

export function writeMedienpaketIndex(inputRoot, outputPath) {
  const built = buildMedienpaketIndex(inputRoot);
  writeFileSync(outputPath, `${JSON.stringify(built.index, null, 2)}\n`, "utf8");
  return built;
}

export function lookupMedienpaketIndex(index, artNr, parentSku = "") {
  const keys = [artNr, parentSku]
    .filter(Boolean)
    .map((key) => key.toUpperCase());

  for (const key of keys) {
    if (index[key]) return index[key];
  }

  for (const [indexedKey, payload] of Object.entries(index)) {
    if (keys.some((key) => indexedKey.startsWith(key) || key.startsWith(indexedKey))) {
      return payload;
    }
  }

  return null;
}
