import type { PickupPoint } from "@/types/pickup-point";

type OmnivaLocation = {
  ZIP: string;
  NAME: string;
  TYPE: string;
  A0_NAME: string;
  A1_NAME?: string;
  A2_NAME?: string;
  A5_NAME?: string;
};

let cache = new Map<string, { fetchedAt: number; points: PickupPoint[] }>();
const CACHE_MS = 1000 * 60 * 60 * 6;

function normalizeOmnivaPoint(location: OmnivaLocation): PickupPoint | null {
  if (location.TYPE !== "0") {
    return null;
  }

  const name = location.NAME?.trim();
  if (!name || name.toLowerCase().includes("picapac")) {
    return null;
  }

  const city =
    location.A2_NAME?.trim() ||
    location.A1_NAME?.trim() ||
    location.A5_NAME?.trim() ||
    "";

  return {
    id: location.ZIP,
    name,
    address: location.A5_NAME?.trim() || city,
    city,
    postcode: location.ZIP,
    carrier: "omniva",
  };
}

export async function fetchOmnivaPickupPoints(country: string) {
  const cacheKey = country.toUpperCase();
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < CACHE_MS) {
    return cached.points;
  }

  const response = await fetch("https://www.omniva.ee/locations.json", {
    next: { revalidate: 60 * 60 * 6 },
  });

  if (!response.ok) {
    throw new Error("Could not load Omniva pickup points");
  }

  const locations = (await response.json()) as OmnivaLocation[];
  const points = locations
    .filter((location) => location.A0_NAME === cacheKey)
    .map(normalizeOmnivaPoint)
    .filter((point): point is PickupPoint => Boolean(point));

  cache.set(cacheKey, { fetchedAt: now, points });
  return points;
}
