import { formatSizeLabel, isLikelyFilterSizeLabel } from "@/lib/shop/size-label";
import { resolveProductColorHex } from "@/lib/shop/product-color-swatches";

const LEG_LENGTH_FROM_SKU: Record<string, string> = {
  P: "petite",
  R: "regular",
  T: "tall",
};

const LEG_LENGTH_LABELS: Record<string, string> = {
  petite: "Petite",
  regular: "Regular",
  tall: "Tall",
};

/** Motogirl / similar SKUs: FIO-TRO-BLK-6P → color BLK, size 6, leg petite. */
const SKU_DIMENSION_PATTERN = /-([A-Za-z]{2,5})-(\d{1,3})([PRT])$/i;

export function isLikelyColorAttributeValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return false;
  }

  if (isLikelyFilterSizeLabel(trimmed)) {
    return false;
  }

  if (resolveProductColorHex(trimmed)) {
    return true;
  }

  const normalized = trimmed.toLowerCase();
  if (/^(blk|yel|red|blu|grn|gry|wht|nav|brn|pnk|org|pur|tan|olv|crm|beige)$/i.test(normalized)) {
    return true;
  }

  return /^[a-z]{2,5}$/i.test(normalized) && !/^\d+$/.test(normalized);
}

export function areAttributeOptionsLikelyColors(
  options: readonly (string | null | undefined)[],
) {
  const values = options
    .map((option) => option?.trim())
    .filter((option): option is string => Boolean(option));

  if (values.length === 0) {
    return false;
  }

  return values.every(isLikelyColorAttributeValue);
}

export function parseVariationSkuDimensions(sku: string | null | undefined) {
  const trimmed = sku?.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(SKU_DIMENSION_PATTERN);
  if (!match) {
    return null;
  }

  const [, colorCode, size, legCode] = match;
  const legLength = LEG_LENGTH_FROM_SKU[legCode.toUpperCase()];

  if (!legLength) {
    return null;
  }

  return {
    color: colorCode.toLowerCase(),
    size: formatSizeLabel(size),
    legLength,
  };
}

export function buildVariationLookupKey(input: {
  size?: string;
  color?: string;
  legLength?: string;
}) {
  return [
    input.size?.trim() ? formatSizeLabel(input.size) : "",
    input.color?.trim().toLowerCase() ?? "",
    input.legLength?.trim().toLowerCase() ?? "",
  ].join("|");
}

export function formatLegLengthLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  return LEG_LENGTH_LABELS[normalized] ?? formatSizeLabel(value);
}

export function shouldMapColorToPaSize(input: {
  size?: string;
  color?: string;
}) {
  if (!input.color?.trim() || !input.size?.trim()) {
    return false;
  }

  const normalizedSize = formatSizeLabel(input.size);
  const normalizedColor = input.color.trim();

  return (
    /^\d{1,3}$/.test(normalizedSize) &&
    /^[a-z]{2,4}$/i.test(normalizedColor) &&
    isLikelyColorAttributeValue(normalizedColor)
  );
}
