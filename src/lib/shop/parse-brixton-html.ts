import type { Locale } from "@/i18n/config";
import type { ProductSpec } from "@/types/catalog-product";
import { parseSpecsFromDescriptionHtml } from "@/lib/shop/parse-product-description";
import {
  localizeMotorcycleEditorialTitle,
  localizeMotorcycleSpecs,
  isHighlightSpecLabel,
} from "@/lib/shop/motorcycle-spec-labels";

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#215;/g, "×")
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyId(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type ParsedEditorialSection = {
  title: string;
  paragraphs: string[];
};

export type ParsedShortDescription = {
  tagline?: string;
  editorialSections: ParsedEditorialSection[];
  /** @deprecated Use editorialSections — kept for manual Motorock enrichment only. */
  features: string[];
  colorMentions?: string;
};

/**
 * Parses Motomad/Brixton-style short descriptions from Motorock WC.
 * Tagline (h3), DESIGN / EQUIPMENT / FINISHES blocks.
 */
export function parseMotorcycleShortDescription(
  html: string,
  locale: Locale = "en",
): ParsedShortDescription {
  const h2Tagline = stripHtml(
    html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "",
  );
  const h3Tagline = stripHtml(
    html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] ?? "",
  );
  const brixtonSections = parseShortDescriptionSections(html, locale);
  const h3Sections = parseH3EditorialSections(html, locale);
  const editorialSections =
    brixtonSections.length > 0 ? brixtonSections : h3Sections;
  const tagline = h2Tagline || h3Tagline || undefined;
  const features = editorialSections
    .filter((section) => section.title.toLowerCase() === "equipment")
    .flatMap((section) => section.paragraphs);

  const finishes = html.match(
    /FINISHES<\/strong>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i,
  )?.[1];

  return {
    tagline: tagline || undefined,
    editorialSections,
    features,
    colorMentions: finishes ? stripHtml(finishes) : undefined,
  };
}

function parseShortDescriptionSections(html: string, locale: Locale = "en") {
  const sections: ParsedEditorialSection[] = [];
  const headerPattern = /<p[^>]*>\s*<strong[^>]*>([\s\S]*?)<\/strong>\s*<\/p>/gi;
  const headers = [...html.matchAll(headerPattern)];

  for (let index = 0; index < headers.length; index += 1) {
    const title = localizeMotorcycleEditorialTitle(
      stripHtml(headers[index][1]),
      locale,
    );
    if (!title) {
      continue;
    }

    const blockStart = headers[index].index! + headers[index][0].length;
    const blockEnd =
      index + 1 < headers.length ? headers[index + 1].index! : html.length;
    const block = html.slice(blockStart, blockEnd);
    const paragraphs = collectParagraphsFromHtmlBlock(block);

    if (paragraphs.length > 0) {
      sections.push({ title, paragraphs });
    }
  }

  return sections;
}

/** Mutt-style short copy: `<h3>` section titles with following `<p>` blocks. */
function parseH3EditorialSections(html: string, locale: Locale = "en") {
  const sections: ParsedEditorialSection[] = [];
  const blocks = html.split(/<h3\b[^>]*>/i).slice(1);

  for (const block of blocks) {
    const title = localizeMotorcycleEditorialTitle(
      stripHtml(block.match(/^([\s\S]*?)<\/h3>/i)?.[1] ?? ""),
      locale,
    );
    if (!title) {
      continue;
    }

    const body = block.replace(/^[\s\S]*?<\/h3>/i, "");
    const paragraphs = collectParagraphsFromHtmlBlock(body);

    if (paragraphs.length > 0) {
      sections.push({ title, paragraphs });
    }
  }

  return sections;
}

function collectParagraphsFromHtmlBlock(block: string) {
  const paragraphs: string[] = [];

  for (const paragraphMatch of block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = stripHtml(paragraphMatch[1]);
    if (text) {
      paragraphs.push(text);
    }
  }

  for (const listMatch of block.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)) {
    const text = stripHtml(listMatch[1]);
    if (text) {
      paragraphs.push(text);
    }
  }

  return paragraphs;
}

export type ParsedDescriptionSection = {
  title: string;
  specs: ProductSpec[];
};

/** Brixton/Motomad/Malaguti long description with `<section>` + spec sub-sections. */
export function parseBrixtonDescriptionSections(
  html: string,
): ParsedDescriptionSection[] {
  const fromSections = parseSectionTagSpecs(html);
  if (fromSections.length > 0) {
    return fromSections;
  }

  const fromHeadings = parseHeadingParagraphSpecs(html);
  if (fromHeadings.length > 0) {
    return fromHeadings;
  }

  const fromStrongParagraphs = parseStrongParagraphSpecs(html);
  if (fromStrongParagraphs.length > 0) {
    return [{ title: "Specifications", specs: fromStrongParagraphs }];
  }

  const fromAlternatingParagraphs = parseAlternatingParagraphSpecs(html);
  if (fromAlternatingParagraphs.length > 0) {
    return [{ title: "Specifications", specs: fromAlternatingParagraphs }];
  }

  const fromH5Lists = parseH5ListSpecs(html);
  if (fromH5Lists.length > 0) {
    return [{ title: "Specifications", specs: fromH5Lists }];
  }

  return [];
}

/** Mutt-style long description: `<h5>Label:</h5><ul><li>value</li></ul>`. */
function parseH5ListSpecs(html: string): ProductSpec[] {
  const specs: ProductSpec[] = [];
  const pattern = /<h5[^>]*>([\s\S]*?)<\/h5>\s*<ul[^>]*>([\s\S]*?)<\/ul>/gi;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const label = stripHtml(match[1]).replace(/:+$/, "");
    const values: string[] = [];

    for (const listItem of match[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)) {
      const text = stripHtml(listItem[1]);
      if (text) {
        values.push(text);
      }
    }

    const value = values.join(", ");
    if (!isValidProductSpec(label, value)) {
      continue;
    }

    specs.push({
      id: slugifyId(label),
      label,
      value,
    });
  }

  return specs;
}

function parseSectionTagSpecs(html: string): ParsedDescriptionSection[] {
  const sections: ParsedDescriptionSection[] = [];
  const sectionPattern = /<section[^>]*>([\s\S]*?)<\/section>/gi;

  let sectionMatch: RegExpExecArray | null;
  while ((sectionMatch = sectionPattern.exec(html)) !== null) {
    const block = sectionMatch[1];
    const title = stripHtml(
      block.match(/<h[34][^>]*>([\s\S]*?)<\/h[34]>/i)?.[1] ?? "",
    );

    if (!title) {
      continue;
    }

    const specs = parseSubSectionSpecsFromBlock(block, title);

    if (specs.length > 0) {
      sections.push({ title, specs });
    }
  }

  return sections;
}

/** Motron/Mutt style: `<h3>` sections with `<p><strong>Label</strong></p><ul><li>…</li>`. */
function parseHeadingParagraphSpecs(html: string): ParsedDescriptionSection[] {
  const sections: ParsedDescriptionSection[] = [];
  const blocks = html.split(/<h3\b[^>]*>/i).slice(1);

  for (const block of blocks) {
    const title = stripHtml(block.match(/^([\s\S]*?)<\/h3>/i)?.[1] ?? "");
    if (!title) {
      continue;
    }

    const body = block.replace(/^[\s\S]*?<\/h3>/i, "");
    const specs: ProductSpec[] = [];
    const specPattern =
      /<p[^>]*>[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>[\s\S]*?<\/p>\s*<ul[^>]*>[\s\S]*?<li[^>]*>([\s\S]*?)<\/li>/gi;

    let specMatch: RegExpExecArray | null;
    while ((specMatch = specPattern.exec(body)) !== null) {
      const label = stripHtml(specMatch[1]);
      const value = stripHtml(specMatch[2]);

      if (!isValidProductSpec(label, value)) {
        continue;
      }

      specs.push({
        id: slugifyId(`${title}-${label}`),
        label,
        value,
      });
    }

    if (specs.length > 0) {
      sections.push({ title, specs });
    }
  }

  return sections;
}

function parseSubSectionSpecsFromBlock(
  block: string,
  sectionTitle: string,
): ProductSpec[] {
  const specs: ProductSpec[] = [];
  const subSectionPattern = /<div class="sub-section">([\s\S]*?)<\/div>/gi;

  let subMatch: RegExpExecArray | null;
  while ((subMatch = subSectionPattern.exec(block)) !== null) {
    const subBlock = subMatch[1];
    const label = stripHtml(subBlock.match(/<h5[^>]*>([\s\S]*?)<\/h5>/i)?.[1] ?? "");
    const value = stripHtml(
      subBlock.match(/<li[^>]*class="spec"[^>]*>([\s\S]*?)<\/li>/i)?.[1] ??
        subBlock.match(/<li[^>]*>([\s\S]*?)<\/li>/i)?.[1] ??
        subBlock.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ??
        "",
    );

    if (!isValidProductSpec(label, value)) {
      continue;
    }

    specs.push({
      id: slugifyId(`${sectionTitle}-${label}`),
      label,
      value,
    });
  }

  return specs;
}

/** Block editor / Rayburn style: `<p><strong>Label</strong></p><p>value</p>`. */
function parseStrongParagraphSpecs(html: string): ProductSpec[] {
  const specs: ProductSpec[] = [];
  const pattern =
    /<p[^>]*>\s*<strong[^>]*>([\s\S]*?)<\/strong>\s*<\/p>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const label = stripHtml(match[1]);
    const value = stripHtml(match[2]);

    if (!isValidProductSpec(label, value)) {
      continue;
    }

    specs.push({
      id: slugifyId(label),
      label,
      value,
    });
  }

  return specs;
}

function isLikelySpecLabel(label: string, value: string) {
  if (!isValidProductSpec(label, value)) {
    return false;
  }

  if (label.length > 80 || value.length <= label.length) {
    return false;
  }

  return true;
}

/** Rayburn / classic Brixton: alternating label/value paragraphs (`p1`/`p2` or plain). */
function parseAlternatingParagraphSpecs(html: string): ProductSpec[] {
  const specs: ProductSpec[] = [];
  const paragraphPattern = /<p([^>]*)>([\s\S]*?)<\/p>/gi;
  const paragraphs = [...html.matchAll(paragraphPattern)];

  for (let index = 0; index < paragraphs.length - 1; index += 1) {
    const attrs = paragraphs[index][1];
    const nextAttrs = paragraphs[index + 1][1];
    const label = stripHtml(paragraphs[index][2]);
    const value = stripHtml(paragraphs[index + 1][2]);
    const isP1P2Pair =
      /\bp1\b/i.test(attrs) && /\bp2\b/i.test(nextAttrs);

    if (!isP1P2Pair && !isLikelySpecLabel(label, value)) {
      continue;
    }

    if (!isValidProductSpec(label, value)) {
      continue;
    }

    specs.push({
      id: slugifyId(label),
      label,
      value,
    });
    index += 1;
  }

  return specs;
}

export function isValidProductSpec(label: string, value: string) {
  const normalizedLabel = label.trim();
  const normalizedValue = value.trim();

  if (!normalizedLabel || !normalizedValue) {
    return false;
  }

  if (normalizedLabel.toLowerCase() === normalizedValue.toLowerCase()) {
    return false;
  }

  return normalizedValue.length <= 180;
}

export function filterValidProductSpecs(
  specs: readonly ProductSpec[],
): ProductSpec[] {
  return specs.filter((spec) => isValidProductSpec(spec.label, spec.value));
}

/** Remove structured spec blocks from supplier HTML — keep editorial copy only. */
export function stripMotorcycleSpecHtml(html: string) {
  return html
    .replace(/<section[^>]*>[\s\S]*?<\/section>/gi, "")
    .replace(/<h5[^>]*>[\s\S]*?<\/h5>\s*<ul[^>]*>[\s\S]*?<\/ul>/gi, "")
    .replace(/<h3\b[^>]*>[\s\S]*?(?=<h3\b[^>]*>|$)/gi, (block) =>
      /<strong[\s\S]*?<\/strong>[\s\S]*?<ul\b/i.test(block) ? "" : block,
    )
    .replace(/<table[\s\S]*?<\/table>/gi, "")
    .replace(
      /<p[^>]*>\s*<strong[^>]*>[\s\S]*?<\/strong>\s*<\/p>\s*<p[^>]*>[\s\S]*?<\/p>/gi,
      "",
    )
    .replace(
      /<p[^>]*class="[^"]*\bp1\b[^"]*"[^>]*>[\s\S]*?<\/p>\s*<p[^>]*class="[^"]*\bp2\b[^"]*"[^>]*>[\s\S]*?<\/p>/gi,
      "",
    )
    .replace(/<p[^>]*>\s*<\/p>/gi, "")
    .replace(/<div[^>]*>\s*<\/div>/gi, "")
    .trim();
}

export function hasMeaningfulDescriptionHtml(html: string) {
  return stripHtml(stripMotorcycleSpecHtml(html)).length >= 40;
}

const HIGHLIGHT_LABELS = new Set([
  "engine capacity",
  "max. power",
  "max. torque",
  "mass in running order",
  "seat height",
  "displacement",
]);

export function pickHighlightSpecs(sections: ParsedDescriptionSection[]) {
  const all = sections.flatMap((section) => section.specs);
  const picked = all.filter(
    (spec) =>
      HIGHLIGHT_LABELS.has(spec.label.toLowerCase()) ||
      isHighlightSpecLabel(spec.label),
  );

  if (picked.length >= 2) {
    return picked.slice(0, 4);
  }

  return all.slice(0, 4);
}

export function splitSpecsBySection(sections: ParsedDescriptionSection[]) {
  const engineSpecs: ProductSpec[] = [];
  const chassisSpecs: ProductSpec[] = [];
  const generalSpecs: ProductSpec[] = [];
  const performanceSpecs: ProductSpec[] = [];

  for (const section of sections) {
    const key = section.title.toLowerCase();
    const specs = filterValidProductSpecs(section.specs);

    if (
      key.includes("engine") ||
      key.includes("transmission") ||
      key.includes("battery") ||
      key.includes("mootor") ||
      key.includes("ulekanne")
    ) {
      engineSpecs.push(...specs);
    } else if (key.includes("chassis") || key.includes("raam")) {
      chassisSpecs.push(...specs);
    } else if (
      key.includes("dimension") ||
      key.includes("mass") ||
      key.includes("mood") ||
      key.includes("kaal")
    ) {
      generalSpecs.push(...specs);
    } else if (key.includes("driving") || key.includes("performance")) {
      performanceSpecs.push(...specs);
    }
  }

  return {
    engineSpecs,
    moreEngineSpecs: [...chassisSpecs, ...performanceSpecs],
    generalSpecs,
  };
}

export function resolveMotorcycleCatalogCopy(
  longHtml: string,
  shortHtml = "",
  locale: Locale = "en",
) {
  const sections = parseBrixtonDescriptionSections(longHtml);
  const tableSpecs = filterValidProductSpecs(
    parseSpecsFromDescriptionHtml(longHtml),
  );
  const { engineSpecs, moreEngineSpecs, generalSpecs } =
    splitSpecsBySection(sections);
  const hasStructuredSpecs =
    engineSpecs.length > 0 ||
    moreEngineSpecs.length > 0 ||
    generalSpecs.length > 0 ||
    tableSpecs.length > 0 ||
    sections.some((section) => section.specs.length > 0);
  const marketingHtml = stripMotorcycleSpecHtml(longHtml);
  const descriptionHtml = hasStructuredSpecs
    ? hasMeaningfulDescriptionHtml(marketingHtml)
      ? marketingHtml
      : ""
    : longHtml || (shortHtml ? `<p>${shortHtml}</p>` : "");
  const parsedSpecs =
    tableSpecs.length > 0
      ? tableSpecs
      : filterValidProductSpecs(sections.flatMap((section) => section.specs));
  const highlightSpecs =
    sections.length > 0 ? pickHighlightSpecs(sections) : tableSpecs.slice(0, 4);

  return {
    descriptionHtml,
    parsedSpecs: localizeMotorcycleSpecs(parsedSpecs, locale),
    engineSpecs: localizeMotorcycleSpecs(engineSpecs, locale),
    moreEngineSpecs: localizeMotorcycleSpecs(moreEngineSpecs, locale),
    generalSpecs: localizeMotorcycleSpecs(generalSpecs, locale),
    highlightSpecs: localizeMotorcycleSpecs(highlightSpecs, locale),
  };
}

export function isLifestyleImageUrl(url: string) {
  return /lifestyle/i.test(url);
}

export function splitCatalogImages(
  featured?: string | null,
  gallery: readonly string[] = [],
) {
  const merged = [
    ...(featured ? [featured] : []),
    ...gallery.filter((url) => url !== featured),
  ];
  const unique = [...new Set(merged)];

  const productImages = unique.filter((url) => !isLifestyleImageUrl(url));
  const lifestyleImages = unique.filter((url) => isLifestyleImageUrl(url));

  return {
    productImages: productImages.length > 0 ? productImages : unique.slice(0, 1),
    lifestyleImages,
  };
}
