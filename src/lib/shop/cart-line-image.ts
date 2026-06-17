import type { CartLine } from "@/context/cart-context";

const MOTORCYCLE_BRAND_SLUGS = new Set(["brixton", "mutt", "motron", "malaguti"]);

function legacyMotorcycleLine(line: CartLine) {
  if (!line.brand) {
    return false;
  }

  const normalized = line.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return MOTORCYCLE_BRAND_SLUGS.has(normalized);
}

export function isMotorcycleCartLine(line: CartLine) {
  if (line.type === "motorcycle") {
    return true;
  }

  if (line.type === "equipment") {
    return false;
  }

  return legacyMotorcycleLine(line);
}

export function cartLineThumbnailClass(line: CartLine) {
  const isMotorcycle = isMotorcycleCartLine(line);

  return {
    frame: isMotorcycle
      ? "aspect-[4/3] bg-white"
      : "aspect-[4/5] bg-surface",
    image: isMotorcycle
      ? "object-contain object-center p-1.5"
      : "object-cover object-center",
  };
}
