const UK_WOMEN_TO_EU: Record<number, number> = {
  4: 32,
  6: 34,
  8: 36,
  10: 38,
  12: 40,
  14: 42,
  16: 44,
  18: 46,
  20: 48,
  22: 50,
  24: 52,
  26: 54,
  28: 56,
};

export function ukWomenToEu(uk: number) {
  return UK_WOMEN_TO_EU[uk];
}

export function formatEuUkSizeLabel(uk: number) {
  const eu = ukWomenToEu(uk);
  if (!eu) {
    return String(uk);
  }

  return `EU${eu} (UK${uk})`;
}

export function slugifyEuUkSizeLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[()]/g, "");
}

/** Parse "EU38 (UK10)", "eu38-uk10", or plain UK "10". */
export function parseEuUkSize(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const compound = trimmed.match(/^EU(\d{2,3})\s*\(UK(\d{1,2})\)$/i);
  if (compound) {
    return {
      eu: Number(compound[1]),
      uk: Number(compound[2]),
      label: `EU${compound[1]} (UK${compound[2]})`,
    };
  }

  const slugLike = trimmed.match(/^eu(\d{2,3})-uk(\d{1,2})$/i);
  if (slugLike) {
    return {
      eu: Number(slugLike[1]),
      uk: Number(slugLike[2]),
      label: `EU${slugLike[1]} (UK${slugLike[2]})`,
    };
  }

  if (/^\d{1,2}$/.test(trimmed)) {
    const uk = Number(trimmed);
    const eu = ukWomenToEu(uk);
    if (eu) {
      return { eu, uk, label: formatEuUkSizeLabel(uk) };
    }
  }

  return null;
}

export function euUkSizesMatch(left: string, right: string) {
  const a = parseEuUkSize(left);
  const b = parseEuUkSize(right);

  if (a && b) {
    return a.uk === b.uk;
  }

  if (a && !b) {
    return (
      left.trim().toLowerCase() === String(a.uk) ||
      slugifyEuUkSizeLabel(a.label) === right.trim().toLowerCase()
    );
  }

  if (!a && b) {
    return (
      right.trim().toLowerCase() === String(b.uk) ||
      slugifyEuUkSizeLabel(b.label) === left.trim().toLowerCase()
    );
  }

  return false;
}

/** Normalize cart/UI size labels to Woo `pa_size` term slugs. */
export function cartSizeToWooSizeSlug(size: string) {
  const trimmed = size.trim();
  if (!trimmed) {
    return "";
  }

  const parsed = parseEuUkSize(trimmed);
  if (parsed) {
    return slugifyEuUkSizeLabel(parsed.label);
  }

  if (trimmed.includes("/")) {
    return trimmed.toLowerCase().replace(/\//g, "-").replace(/\s+/g, "");
  }

  if (/[()]/.test(trimmed) || /\d+\s*x\s*\d+/i.test(trimmed)) {
    return trimmed
      .toLowerCase()
      .replace(/[()]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  return trimmed.toLowerCase();
}

export function colorToWooColorSlug(color: string) {
  const slug = color.trim().toLowerCase();
  const aliases: Record<string, string> = {
    blk: "black",
    yel: "yellow",
    blu: "blue",
    gry: "grey",
    wht: "white",
  };

  return aliases[slug] ?? slug;
}
