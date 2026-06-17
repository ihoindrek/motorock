const SIZE_RANK = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
  "26",
  "28",
  "30",
  "32",
  "34",
  "36",
  "42",
  "43",
  "44",
  "45",
  "S/M",
  "L/XL",
  "One size",
] as const;

const SIZE_ALIASES: Record<string, string> = {
  XXL: "2XL",
  XXXL: "3XL",
  XXXXL: "4XL",
  XXXXXL: "5XL",
  XXXXXXL: "6XL",
};

function normalizeSizeKey(size: string) {
  return size.trim().toUpperCase();
}

function getSizeRank(size: string) {
  const key = normalizeSizeKey(size);
  const canonical = SIZE_ALIASES[key] ?? key;
  const index = SIZE_RANK.findIndex(
    (rank) => normalizeSizeKey(rank) === canonical,
  );

  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

export function sortProductSizes(sizes: readonly string[]) {
  return [...sizes].sort((left, right) => {
    const rankDifference = getSizeRank(left) - getSizeRank(right);

    if (rankDifference !== 0) {
      return rankDifference;
    }

    return left.localeCompare(right, undefined, { sensitivity: "base" });
  });
}
