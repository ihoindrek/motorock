import type { Locale } from "@/i18n/config";
import type { ProductSpec } from "@/types/catalog-product";
import { resolveMotorcycleCatalogCopy } from "@/lib/shop/parse-brixton-html";
import { specLabelCategoryBucket } from "@/lib/shop/motorcycle-spec-labels";
import {
  isMostlyPlainTextSpecs,
  parsePlainTextMotorcycleSpecs,
} from "@/lib/shop/parse-plain-text-motorcycle-specs";
import type { MotorcycleContentOverrides } from "@/lib/shop/normalize-motorcycle-content";
import { localizeMotorcycleSpecs } from "@/lib/shop/motorcycle-spec-labels";

export const MOTORCYCLE_SPEC_META_KEYS = {
  specsHtml: "motorcycle_specs_html",
  specsSourceUrl: "motorcycle_specs_source_url",
  supplierDescription: "_motorock_supplier_description",
  specsSnapshot: "_motorock_motorcycle_specs",
} as const;

const MOTORCYCLE_SPECS_HTML_KEYS = [
  MOTORCYCLE_SPEC_META_KEYS.specsHtml,
  "_motorcycle_specs_html",
] as const;

export type MotorcycleSpecSnapshot = {
  highlightSpecs: ProductSpec[];
  engineSpecs: ProductSpec[];
  extendedSpecs: ProductSpec[];
  dimensionSpecs: ProductSpec[];
};

export function buildMotorcycleSpecSnapshot(
  supplierHtml: string,
  shortHtml = "",
  locale: Locale = "en",
): MotorcycleSpecSnapshot | null {
  const trimmed = supplierHtml.trim();
  if (!trimmed) {
    return null;
  }

  const catalog = resolveMotorcycleCatalogCopy(trimmed, shortHtml, locale);
  let engineSpecs = [...catalog.engineSpecs];
  let extendedSpecs = [...catalog.moreEngineSpecs];
  let dimensionSpecs = [...catalog.generalSpecs];
  let parsedSpecs = [...catalog.parsedSpecs];
  let highlightSpecs = [...catalog.highlightSpecs];

  if (
    parsedSpecs.length === 0 &&
    engineSpecs.length === 0 &&
    extendedSpecs.length === 0 &&
    dimensionSpecs.length === 0 &&
    isMostlyPlainTextSpecs(trimmed)
  ) {
    parsedSpecs = parsePlainTextMotorcycleSpecs(trimmed);
    highlightSpecs = parsedSpecs.slice(0, 4);
  }

  for (const spec of parsedSpecs) {
    const bucket = specLabelCategoryBucket(spec.label);
    if (bucket === "engine") {
      engineSpecs.push(spec);
    } else if (bucket === "dimension") {
      dimensionSpecs.push(spec);
    } else {
      extendedSpecs.push(spec);
    }
  }

  const hasSpecs =
    parsedSpecs.length > 0 ||
    engineSpecs.length > 0 ||
    extendedSpecs.length > 0 ||
    dimensionSpecs.length > 0;

  if (!hasSpecs) {
    return null;
  }

  return {
    highlightSpecs,
    engineSpecs,
    extendedSpecs,
    dimensionSpecs,
  };
}

export function motorcycleSpecSnapshotToOverrides(
  snapshot: MotorcycleSpecSnapshot,
  locale: Locale = "en",
): MotorcycleContentOverrides {
  return {
    highlightSpecs: localizeMotorcycleSpecs(snapshot.highlightSpecs, locale),
    engineSpecs: localizeMotorcycleSpecs(snapshot.engineSpecs, locale),
    moreEngineSpecs: localizeMotorcycleSpecs(snapshot.extendedSpecs, locale),
    generalSpecs: localizeMotorcycleSpecs(snapshot.dimensionSpecs, locale),
  };
}

export function serializeMotorcycleSpecSnapshot(snapshot: MotorcycleSpecSnapshot) {
  return JSON.stringify(snapshot);
}

export function parseMotorcycleSpecSnapshotJson(
  value: string | null | undefined,
): MotorcycleSpecSnapshot | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<MotorcycleSpecSnapshot>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const normalize = (items: unknown): ProductSpec[] =>
      Array.isArray(items)
        ? items.filter(
            (item): item is ProductSpec =>
              Boolean(item) &&
              typeof item === "object" &&
              typeof (item as ProductSpec).label === "string" &&
              typeof (item as ProductSpec).value === "string",
          )
        : [];

    const snapshot: MotorcycleSpecSnapshot = {
      highlightSpecs: normalize(parsed.highlightSpecs),
      engineSpecs: normalize(parsed.engineSpecs),
      extendedSpecs: normalize(parsed.extendedSpecs),
      dimensionSpecs: normalize(parsed.dimensionSpecs),
    };

    const hasAny =
      snapshot.highlightSpecs.length > 0 ||
      snapshot.engineSpecs.length > 0 ||
      snapshot.extendedSpecs.length > 0 ||
      snapshot.dimensionSpecs.length > 0;

    return hasAny ? snapshot : null;
  } catch {
    return null;
  }
}

export function readMetaString(
  meta: readonly { key?: string | null; value?: string | null }[] | null | undefined,
  key: string,
) {
  const entry = meta?.find((item) => item.key === key);
  const value = entry?.value?.trim();
  return value || null;
}

export function readMotorcycleSpecsHtmlFromMeta(
  meta: readonly { key?: string | null; value?: string | null }[] | null | undefined,
) {
  for (const key of MOTORCYCLE_SPECS_HTML_KEYS) {
    const value = readMetaString(meta, key);
    if (value) {
      return value;
    }
  }

  return null;
}

export function resolveMotorcycleSpecOverrides(input: {
  longHtml: string;
  shortHtml: string;
  locale: Locale;
  meta?: readonly { key?: string | null; value?: string | null }[] | null;
  /** WPML sibling products — specs fall back to EN when ET ACF field is empty. */
  metaSources?: readonly {
    meta?: readonly { key?: string | null; value?: string | null }[] | null;
  }[];
}): MotorcycleContentOverrides | undefined {
  const metaCandidates = [
    input.meta,
    ...(input.metaSources?.map((source) => source.meta) ?? []),
  ].filter(
    (meta): meta is readonly { key?: string | null; value?: string | null }[] =>
      Boolean(meta?.length),
  );

  const seen = new Set<readonly { key?: string | null; value?: string | null }[]>();

  for (const meta of metaCandidates) {
    if (seen.has(meta)) {
      continue;
    }

    seen.add(meta);

    const acfSpecsHtml = readMotorcycleSpecsHtmlFromMeta(meta);
    if (acfSpecsHtml) {
      const fromAcf = buildMotorcycleSpecSnapshot(
        acfSpecsHtml,
        input.shortHtml,
        input.locale,
      );
      if (fromAcf) {
        return motorcycleSpecSnapshotToOverrides(fromAcf, input.locale);
      }
    }

    const snapshotJson = readMetaString(
      meta,
      MOTORCYCLE_SPEC_META_KEYS.specsSnapshot,
    );
    const snapshot = parseMotorcycleSpecSnapshotJson(snapshotJson);
    if (snapshot) {
      return motorcycleSpecSnapshotToOverrides(snapshot, input.locale);
    }

    const supplierHtml = readMetaString(
      meta,
      MOTORCYCLE_SPEC_META_KEYS.supplierDescription,
    );
    if (supplierHtml) {
      const built = buildMotorcycleSpecSnapshot(
        supplierHtml,
        input.shortHtml,
        input.locale,
      );
      if (built) {
        return motorcycleSpecSnapshotToOverrides(built, input.locale);
      }
    }
  }

  const built = buildMotorcycleSpecSnapshot(
    input.longHtml,
    input.shortHtml,
    input.locale,
  );

  return built ? motorcycleSpecSnapshotToOverrides(built, input.locale) : undefined;
}
