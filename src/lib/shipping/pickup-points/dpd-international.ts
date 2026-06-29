import type { PickupPoint } from "@/types/pickup-point";
import type { MontonioPickupPointType } from "@/lib/shipping/pickup-carrier";

type DpdCountry = {
  id: number;
  iso: string;
  name: string;
};

type DpdInternationalShop = {
  id: string;
  company: string;
  street: string;
  city: string;
  house_number?: string;
  postcode: string;
  pickup_network_type: string;
};

const BALTIC_COUNTRIES = new Set(["EE", "LV", "LT"]);
const countriesCache: {
  fetchedAt: number;
  byIso: Map<string, number>;
} = { fetchedAt: 0, byIso: new Map() };
const pointsCache = new Map<string, { fetchedAt: number; points: PickupPoint[] }>();
const CACHE_MS = 1000 * 60 * 60 * 6;

function matchesPickupType(
  networkType: string,
  type?: MontonioPickupPointType,
) {
  if (!type) {
    return true;
  }

  if (type === "parcelMachine") {
    return networkType === "dpd_box";
  }

  if (type === "parcelShop") {
    return networkType === "pickup_point";
  }

  return true;
}

async function resolveDpdCountryId(country: string) {
  const iso = country.toUpperCase();
  const now = Date.now();

  if (
    countriesCache.byIso.size > 0 &&
    now - countriesCache.fetchedAt < CACHE_MS
  ) {
    return countriesCache.byIso.get(iso) ?? null;
  }

  const response = await fetch("https://pickup.dpd.cz/api/getCountries", {
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    throw new Error("Could not load DPD country list");
  }

  const payload = (await response.json()) as {
    data?: { items?: DpdCountry[] };
  };

  countriesCache.byIso = new Map(
    (payload.data?.items ?? []).map((item) => [
      item.iso.toUpperCase(),
      item.id,
    ]),
  );
  countriesCache.fetchedAt = now;

  return countriesCache.byIso.get(iso) ?? null;
}

export function isDpdBalticsCountry(country: string) {
  return BALTIC_COUNTRIES.has(country.toUpperCase());
}

export async function fetchDpdInternationalPickupPoints(
  country: string,
  type?: MontonioPickupPointType,
) {
  const iso = country.toUpperCase();
  if (isDpdBalticsCountry(iso)) {
    return [];
  }

  const cacheKey = `${iso}:${type ?? "all"}`;
  const cached = pointsCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < CACHE_MS) {
    return cached.points;
  }

  const countryId = await resolveDpdCountryId(iso);
  if (!countryId) {
    return [];
  }

  const response = await fetch(
    `https://pickup.dpd.cz/api/getAll?country=${countryId}&lang=en`,
    { next: { revalidate: 60 * 60 * 6 } },
  );

  if (!response.ok) {
    throw new Error("Could not load DPD pickup points");
  }

  const payload = (await response.json()) as {
    data?: { items?: DpdInternationalShop[] };
  };

  const points = (payload.data?.items ?? [])
    .filter((shop) => matchesPickupType(shop.pickup_network_type, type))
    .map((shop) => ({
      id: shop.id,
      name: shop.company,
      address: [shop.street, shop.house_number].filter(Boolean).join(" ").trim(),
      city: shop.city,
      postcode: shop.postcode,
      carrier: "dpd" as const,
    }));

  pointsCache.set(cacheKey, { fetchedAt: now, points });
  return points;
}
