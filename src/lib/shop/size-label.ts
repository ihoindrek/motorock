const ONE_SIZE_LABELS = new Set([
  "one size",
  "one-size",
  "onesize",
  "üks suurus",
  "uks suurus",
]);

export type SizeAttributeTerm = {
  name: string;
  slug: string;
};

/** Strip WPML locale suffixes from attribute option slugs (`s-et` → `s`). */
export function stripSizeLocaleSuffix(value: string) {
  return value.trim().replace(/-(et|en)$/i, "");
}

/** True when the cart/catalog size means “no size choice” (incl. ET copy). */
export function isOneSizeLabel(value: string | undefined | null) {
  if (!value?.trim()) {
    return true;
  }

  return ONE_SIZE_LABELS.has(value.trim().toLowerCase());
}

/** Normalize WooCommerce size attribute values for display and cart keys. */
export function formatSizeLabel(value: string) {
  const trimmed = stripSizeLocaleSuffix(value);

  if (/^w\d+-l\d+$/i.test(trimmed)) {
    return trimmed.replace(/^w(\d+)-l(\d+)$/i, "W$1/L$2");
  }

  if (/^\d+$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  if (/^[a-z0-9]+$/i.test(trimmed) && trimmed.length <= 5) {
    return trimmed.toUpperCase();
  }

  return trimmed;
}

function normalizeCompoundSizeKey(value: string) {
  return formatSizeLabel(value)
    .trim()
    .toLowerCase()
    .replace(/\//g, "-");
}

export function sizesMatch(left: string, right: string) {
  if (formatSizeLabel(left).toLowerCase() === formatSizeLabel(right).toLowerCase()) {
    return true;
  }

  return normalizeCompoundSizeKey(left) === normalizeCompoundSizeKey(right);
}

/** Prefer taxonomy term name over WPML option slug for UI labels. */
export function resolveSizeOptionLabel(
  option: string,
  terms?: readonly SizeAttributeTerm[] | null,
) {
  const raw = option.trim();
  if (!raw) {
    return "";
  }

  if (terms?.length) {
    const optionKey = raw.toLowerCase();
    const baseSlug = stripSizeLocaleSuffix(raw).toLowerCase();
    const formattedOption = formatSizeLabel(raw).toLowerCase();

    const match = terms.find((term) => {
      const slug = term.slug.trim().toLowerCase();
      const name = term.name.trim().toLowerCase();
      return (
        slug === optionKey ||
        slug === baseSlug ||
        name === optionKey ||
        formatSizeLabel(term.name).toLowerCase() === formattedOption
      );
    });

    if (match?.name?.trim()) {
      return formatSizeLabel(match.name);
    }
  }

  return formatSizeLabel(raw);
}

const STANDARD_SIZE_KEYS = new Set([
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "XXXXL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
  "S/M",
  "M/L",
  "L/XL",
  "XL/XXL",
  "X-SMALL",
  "SMALL",
  "MEDIUM",
  "LARGE",
  "X-LARGE",
  "XX-LARGE",
  "XXX-LARGE",
  "M-L",
]);

/** Heuristic for category size filters: allow real size labels, reject color codes. */
export function isLikelyFilterSizeLabel(value: string | undefined | null) {
  if (!value?.trim()) {
    return false;
  }

  const normalized = formatSizeLabel(value)
    .trim()
    .toUpperCase();

  if (isOneSizeLabel(normalized)) {
    return false;
  }

  if (STANDARD_SIZE_KEYS.has(normalized)) {
    return true;
  }

  if (/^W\d+\/L\d+$/i.test(normalized)) {
    return true;
  }

  if (/^\d{1,4}$/.test(normalized)) {
    return true;
  }

  if (/^\d{2,4}[A-Z]{0,3}$/.test(normalized)) {
    return true;
  }

  if (/^(XX|X)?[SML]{1,5}$/i.test(normalized)) {
    return true;
  }

  if (/^(?:\d+[/-])+\d+(?:MM|CM)?$/i.test(normalized)) {
    return true;
  }

  if (/^\d+(?:\.\d+)?\s*(?:MM|CM)$/i.test(normalized)) {
    return true;
  }

  if (/\d/.test(normalized) && /(?:MM|CM|IN|EU|US)\b/i.test(normalized)) {
    return true;
  }

  if (/\d/.test(normalized) && /[-/]/.test(normalized)) {
    return true;
  }

  return false;
}

/** Split multi-region size labels (e.g. UK10/EU38/US8) for stacked button UI. */
export function formatSizeButtonParts(label: string): readonly string[] {
  const formatted = formatSizeLabel(label).trim();
  if (!formatted) {
    return [];
  }

  if (formatted.includes("/")) {
    return formatted
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [formatted];
}

export function isCompoundSizeLabel(label: string) {
  return formatSizeButtonParts(label).length > 1;
}
