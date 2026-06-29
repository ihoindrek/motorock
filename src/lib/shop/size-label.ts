/** Normalize WooCommerce size attribute values for display and cart keys. */
export function formatSizeLabel(value: string) {
  const trimmed = value.trim();

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

export function sizesMatch(left: string, right: string) {
  return formatSizeLabel(left).toLowerCase() === formatSizeLabel(right).toLowerCase();
}
