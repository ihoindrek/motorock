import type {
  ProductColorOption,
  ProductVariation,
} from "@/types/catalog-product";

const NAMED_COLOR_HEX: Record<string, string> = {
  black: "#0B0B0B",
  white: "#F4F4F0",
  grey: "#8A8A8A",
  gray: "#8A8A8A",
  silver: "#C0C0C0",
  red: "#C41E3A",
  blue: "#2B4C7E",
  navy: "#1B2A4A",
  green: "#2D5A3D",
  yellow: "#D4A017",
  orange: "#E85D04",
  brown: "#6B4423",
  beige: "#D8CFC4",
  bronze: "#8C6239",
  gold: "#C9A227",
  titanium: "#878681",
  charcoal: "#36454F",
  burgundy: "#722F37",
  khaki: "#C3B091",
  pink: "#E8A0BF",
  cream: "#F5F0E6",
  teal: "#2F6B6D",
  olive: "#556B2F",
};

const COLOR_NAME_ENTRIES = Object.entries(NAMED_COLOR_HEX).sort(
  (left, right) => right[0].length - left[0].length,
);

export function formatColorLabel(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function guessHexFromColorLabel(label: string): string | undefined {
  const lower = label.toLowerCase();

  for (const [name, hex] of COLOR_NAME_ENTRIES) {
    if (lower.includes(name)) {
      return hex;
    }
  }

  return undefined;
}

export function getSelectableColors(colors: readonly string[]): string[] {
  return colors.filter((color) => color && color !== "—");
}

export function hasMultipleColorChoices(colors: readonly string[]): boolean {
  return getSelectableColors(colors).length > 1;
}

export function buildProductColorOptions(
  colors: readonly string[],
  variations?: readonly ProductVariation[],
): ProductColorOption[] {
  return getSelectableColors(colors).map((slug) => {
    const variation = variations?.find((entry) => entry.color === slug);

    return {
      label: formatColorLabel(slug),
      value: slug,
      hex: guessHexFromColorLabel(slug),
      image: variation?.image,
    };
  });
}
