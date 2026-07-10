import type { CSSProperties } from "react";
import type {
  ProductColorOption,
  ProductVariation,
} from "@/types/catalog-product";

const NAMED_COLOR_HEX: Record<string, string> = {
  anthracite: "#2F2F2F",
  black: "#0B0B0B",
  white: "#F4F4F0",
  grey: "#8A8A8A",
  gray: "#8A8A8A",
  graphite: "#4A4A4A",
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
  sand: "#CBB89D",
  camel: "#B8895B",
  cognac: "#9A463D",
  ivory: "#F2E8D8",
  coral: "#E8705A",
  purple: "#5B3A72",
  violet: "#5B3A72",
  lime: "#A4C639",
  cyan: "#2A9D8F",
  copper: "#B87333",
  rust: "#A0522D",
  stone: "#9C9588",
  midnight: "#1A1A2E",
  denim: "#3A506B",
  mustard: "#C9A227",
  mint: "#98D4BB",
  wine: "#722F37",
  must: "#0B0B0B",
  valge: "#F4F4F0",
  hall: "#8A8A8A",
  hõbehall: "#C0C0C0",
  hikehall: "#C0C0C0",
  punane: "#C41E3A",
  sinine: "#2B4C7E",
  roheline: "#2D5A3D",
  kollane: "#D4A017",
  pruun: "#6B4423",
  beež: "#D8CFC4",
  roosa: "#E8A0BF",
};

const COLOR_NAME_ENTRIES = Object.entries(NAMED_COLOR_HEX).sort(
  (left, right) => right[0].length - left[0].length,
);

export function formatColorLabel(value: string): string {
  if (/[\s/]/.test(value)) {
    return value
      .split(/[\s/]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeColorKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[\s/_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function guessHexFromColorLabel(label: string): string | undefined {
  const lower = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

  for (const [name, hex] of COLOR_NAME_ENTRIES) {
    if (lower.includes(name)) {
      return hex;
    }
  }

  return undefined;
}

export function resolveProductColorHex(rawValue: string): string | undefined {
  const candidates = [
    rawValue,
    formatColorLabel(rawValue),
    rawValue.replace(/[\s/]+/g, "-"),
  ];

  for (const candidate of candidates) {
    const hex = guessHexFromColorLabel(candidate);
    if (hex) {
      return hex;
    }
  }

  return undefined;
}

function findVariationForColor(
  color: string,
  variations?: readonly ProductVariation[],
) {
  if (!variations?.length) {
    return undefined;
  }

  const target = normalizeColorKey(color);

  return variations.find((entry) => normalizeColorKey(entry.color) === target);
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
  return getSelectableColors(colors).map((colorValue) => {
    const variation = findVariationForColor(colorValue, variations);
    const label = formatColorLabel(colorValue);

    return {
      label,
      value: colorValue,
      hex:
        variation?.hex ??
        resolveProductColorHex(colorValue) ??
        resolveProductColorHex(label),
      image: variation?.image,
    };
  });
}

export function getColorSwatchStyle(
  option: Pick<ProductColorOption, "hex" | "image">,
): CSSProperties {
  if (option.image) {
    return {
      backgroundImage: `url(${option.image})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  return {
    backgroundColor: option.hex ?? "#C5C5C5",
  };
}
