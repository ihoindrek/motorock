import type { PickupPoint } from "@/types/pickup-point";
import type { MontonioPickupPointType } from "@/lib/shipping/pickup-carrier";

type GlsDeliveryPoint = {
  id: string;
  name: string;
  type: "parcel-shop" | "parcel-locker" | string;
  contact?: {
    address?: string;
    city?: string;
    postalCode?: string;
    countryCode?: string;
  };
};

const cache = new Map<string, { fetchedAt: number; points: PickupPoint[] }>();
const CACHE_MS = 1000 * 60 * 60 * 6;

function matchesGlsType(
  pointType: string,
  pickupType?: MontonioPickupPointType,
) {
  if (!pickupType) {
    return true;
  }

  if (pickupType === "parcelMachine") {
    return pointType === "parcel-locker";
  }

  if (pickupType === "parcelShop") {
    return pointType === "parcel-shop";
  }

  return true;
}

const ALZABOX_COUNTRIES = new Set(["CZ", "SK", "HU"]);

export type FetchGlsPickupPointsOptions = {
  excludeAlzabox?: boolean;
};

export async function fetchGlsPickupPoints(
  country: string,
  type?: MontonioPickupPointType,
  options?: FetchGlsPickupPointsOptions,
) {
  const iso = country.toLowerCase();
  const cacheKey = `${iso}:${type ?? "all"}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < CACHE_MS) {
    return cached.points;
  }

  const response = await fetch(
    `https://map.gls-hungary.com/data/deliveryPoints/${iso}.json`,
    { next: { revalidate: 60 * 60 * 6 } },
  );

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as {
    items?: GlsDeliveryPoint[];
  };

  const isoUpper = country.toUpperCase();
  const excludeAlzabox =
    options?.excludeAlzabox &&
    ALZABOX_COUNTRIES.has(isoUpper) &&
    type === "parcelMachine";

  const points = (payload.items ?? [])
    .filter((item) => matchesGlsType(item.type, type))
    .filter((item) => !excludeAlzabox || !/alzabox/i.test(item.name))
    .map((item) => ({
      id: item.id,
      name: item.name,
      address: item.contact?.address ?? "",
      city: item.contact?.city ?? "",
      postcode: item.contact?.postalCode ?? "",
      carrier: "gls" as const,
    }))
    .filter((point) => point.name && point.city);

  cache.set(cacheKey, { fetchedAt: now, points });
  return points;
}
