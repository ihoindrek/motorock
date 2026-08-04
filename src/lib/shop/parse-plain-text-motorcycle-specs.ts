import type { ProductSpec } from "@/types/catalog-product";
import { filterValidProductSpecs } from "@/lib/shop/parse-brixton-html";

const SECTION_HEADERS = new Set([
  "specifications",
  "specification",
  "engine",
  "chassis",
  "dimensions and masses",
  "dimension and masses",
  "dimensions",
  "driving performance",
  "performance",
]);

function slugifyId(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function stripHtmlToLines(htmlOrText: string) {
  return htmlOrText
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/t[dh]>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function isSectionHeader(line: string) {
  const normalized = line.toLowerCase().trim();
  if (SECTION_HEADERS.has(normalized)) {
    return true;
  }

  return (
    line.length >= 4 &&
    line === line.toUpperCase() &&
    /[A-Z]/.test(line) &&
    !/\d/.test(line)
  );
}

/** Parse label/value blocks pasted as plain text from manufacturer pages. */
export function parsePlainTextMotorcycleSpecs(htmlOrText: string): ProductSpec[] {
  const lines = stripHtmlToLines(htmlOrText);
  const specs: ProductSpec[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (isSectionHeader(line)) {
      continue;
    }

    const next = lines[index + 1];
    if (!next || isSectionHeader(next)) {
      continue;
    }

    const label = line;
    const value = next;
    const id = slugifyId(label) || `spec-${specs.length}`;

    if (seen.has(id)) {
      index += 1;
      continue;
    }

    seen.add(id);
    specs.push({ id, label, value });
    index += 1;
  }

  return filterValidProductSpecs(specs);
}

export function isMostlyPlainTextSpecs(htmlOrText: string) {
  const trimmed = htmlOrText.trim();
  if (!trimmed) {
    return false;
  }

  const withoutTags = trimmed.replace(/<[^>]+>/g, "").trim();
  const tagCount = (trimmed.match(/<[a-z][^>]*>/gi) ?? []).length;

  return tagCount <= 2 || withoutTags.length >= trimmed.length * 0.85;
}
