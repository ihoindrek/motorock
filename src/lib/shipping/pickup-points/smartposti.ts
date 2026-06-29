import type { PickupPoint } from "@/types/pickup-point";

const cache = new Map<string, { fetchedAt: number; points: PickupPoint[] }>();
const CACHE_MS = 1000 * 60 * 60 * 6;

function parseSmartpostiXml(xml: string, country: string): PickupPoint[] {
  const points: PickupPoint[] = [];
  const itemPattern = /<item>([\s\S]*?)<\/item>/g;

  for (const match of xml.matchAll(itemPattern)) {
    const block = match[1];
    const read = (tag: string) => {
      const tagMatch = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
      return tagMatch?.[1]?.trim() ?? "";
    };

    const type = read("type");
    if (type && type !== "apt" && type !== "ipb" && type !== "pudo") {
      continue;
    }

    const name = read("name");
    const placeId = read("place_id");
    if (!name || !placeId) {
      continue;
    }

    if (read("country").toUpperCase() !== country.toUpperCase()) {
      continue;
    }

    points.push({
      id: placeId,
      name,
      address: read("address"),
      city: read("city"),
      postcode: read("postalcode"),
      carrier: "smartposti",
    });
  }

  return points;
}

export async function fetchSmartpostiPickupPoints(country: string) {
  const cacheKey = country.toUpperCase();
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < CACHE_MS) {
    return cached.points;
  }

  const response = await fetch(
    `https://my.smartpost.ee/api/ext/v1/places?country=${encodeURIComponent(country)}&type=apt`,
    { next: { revalidate: 60 * 60 * 6 } },
  );

  if (!response.ok) {
    throw new Error("Could not load SmartPosti pickup points");
  }

  const xml = await response.text();
  const points = parseSmartpostiXml(xml, country);
  cache.set(cacheKey, { fetchedAt: now, points });
  return points;
}
