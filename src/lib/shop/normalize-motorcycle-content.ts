import type { Locale } from "@/i18n/config";
import type { ProductSpec } from "@/types/catalog-product";
import {
  filterValidProductSpecs,
  isValidProductSpec,
  parseMotorcycleShortDescription,
  resolveMotorcycleCatalogCopy,
} from "@/lib/shop/parse-brixton-html";
import { specLabelCategoryBucket } from "@/lib/shop/motorcycle-spec-labels";
import type { ProductVideo } from "@/lib/shop/parse-product-video";

export type MotorcycleEditorialSection = {
  title: string;
  paragraphs: readonly string[];
};

export type MotorcyclePageContent = {
  tagline?: string;
  keySpecs: ProductSpec[];
  overviewSections: MotorcycleEditorialSection[];
  supplementaryHtml?: string;
  engineSpecs: ProductSpec[];
  extendedSpecs: ProductSpec[];
  dimensionSpecs: ProductSpec[];
  parallaxImages: readonly { src: string; alt: string }[];
  productVideo?: ProductVideo;
};

export type MotorcycleContentOverrides = {
  tagline?: string;
  editorialSections?: readonly MotorcycleEditorialSection[];
  highlightSpecs?: readonly ProductSpec[];
  engineSpecs?: readonly ProductSpec[];
  moreEngineSpecs?: readonly ProductSpec[];
  generalSpecs?: readonly ProductSpec[];
  productVideo?: ProductVideo;
};

const KEY_SPEC_LABELS = new Set([
  "engine capacity",
  "max. power",
  "max. torque",
  "mass in running order",
  "seat height",
  "displacement",
  "top speed",
]);

type SpecBucket = "engine" | "dimension" | "extended";

function categorizeSpecLabel(label: string): SpecBucket {
  return specLabelCategoryBucket(label);
}

function dedupeSpecs(specs: readonly ProductSpec[]) {
  const seen = new Set<string>();
  const result: ProductSpec[] = [];

  for (const spec of specs) {
    const key = spec.id || `${spec.label}:${spec.value}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(spec);
  }

  return filterValidProductSpecs(result);
}

function buildKeySpecs(
  priority: readonly ProductSpec[],
  pool: readonly ProductSpec[],
) {
  const result: ProductSpec[] = [];
  const seen = new Set<string>();

  const add = (spec: ProductSpec) => {
    if (result.length >= 4 || seen.has(spec.id)) {
      return;
    }

    if (!isValidProductSpec(spec.label, spec.value)) {
      return;
    }

    seen.add(spec.id);
    result.push(spec);
  };

  for (const spec of priority) {
    add(spec);
  }

  for (const spec of pool) {
    if (KEY_SPEC_LABELS.has(spec.label.toLowerCase())) {
      add(spec);
    }
  }

  for (const spec of pool) {
    add(spec);
  }

  return result;
}

export type NormalizeMotorcycleContentInput = {
  shortHtml: string;
  longHtml: string;
  productImages: readonly string[];
  /** Dedicated ACF lifestyle gallery — not Woo product gallery. */
  lifestyleGallery?: readonly string[];
  productVideo?: ProductVideo;
  productName: string;
  brand: string;
  locale?: Locale;
  manualEnrichment?: MotorcycleContentOverrides;
};

/** Normalize supplier HTML into a fixed PDP content shape for all motorcycles. */
export function normalizeMotorcycleContent(
  input: NormalizeMotorcycleContentInput,
): MotorcyclePageContent {
  const locale = input.locale ?? "en";
  const parsedShort = parseMotorcycleShortDescription(input.shortHtml, locale);
  const catalog = resolveMotorcycleCatalogCopy(
    input.longHtml,
    input.shortHtml,
    locale,
  );
  const manual = input.manualEnrichment;

  let engineSpecs = dedupeSpecs(manual?.engineSpecs ?? catalog.engineSpecs);
  let extendedSpecs = dedupeSpecs(
    manual?.moreEngineSpecs ?? catalog.moreEngineSpecs,
  );
  let dimensionSpecs = dedupeSpecs(manual?.generalSpecs ?? catalog.generalSpecs);

  const assigned = new Set(
    [...engineSpecs, ...extendedSpecs, ...dimensionSpecs].map((spec) => spec.id),
  );

  for (const spec of catalog.parsedSpecs) {
    if (assigned.has(spec.id)) {
      continue;
    }

    const bucket = categorizeSpecLabel(spec.label);
    if (bucket === "engine") {
      engineSpecs.push(spec);
    } else if (bucket === "dimension") {
      dimensionSpecs.push(spec);
    } else {
      extendedSpecs.push(spec);
    }

    assigned.add(spec.id);
  }

  engineSpecs = dedupeSpecs(engineSpecs);
  extendedSpecs = dedupeSpecs(extendedSpecs);
  dimensionSpecs = dedupeSpecs(dimensionSpecs);

  const specPool = dedupeSpecs([
    ...engineSpecs,
    ...extendedSpecs,
    ...dimensionSpecs,
    ...catalog.parsedSpecs,
  ]);

  const keySpecs = buildKeySpecs(
    manual?.highlightSpecs ?? catalog.highlightSpecs,
    specPool,
  );

  const overviewSections =
    manual?.editorialSections && manual.editorialSections.length > 0
      ? [...manual.editorialSections]
      : parsedShort.editorialSections;

  const supplementaryHtml = catalog.descriptionHtml || undefined;
  const parallaxImages = (input.lifestyleGallery ?? [])
    .filter(Boolean)
    .slice(0, 7)
    .map((src) => ({
      src,
      alt: `${input.brand} ${input.productName}`,
    }));

  return {
    tagline: manual?.tagline ?? parsedShort.tagline,
    keySpecs,
    overviewSections,
    supplementaryHtml,
    engineSpecs,
    extendedSpecs,
    dimensionSpecs,
    parallaxImages,
    productVideo: manual?.productVideo ?? input.productVideo,
  };
}

export function hasMotorcycleOverview(content: MotorcyclePageContent) {
  return (
    content.overviewSections.length > 0 ||
    Boolean(content.supplementaryHtml?.trim())
  );
}

export function hasMotorcycleTechnical(content: MotorcyclePageContent) {
  return (
    content.engineSpecs.length > 0 ||
    content.extendedSpecs.length > 0 ||
    content.dimensionSpecs.length > 0
  );
}
