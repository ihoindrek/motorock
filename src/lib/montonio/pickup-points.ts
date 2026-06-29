import type { PickupCarrier, PickupPoint } from "@/types/pickup-point";
import { getMontonioConfig } from "@/lib/montonio/config";
import { createMontonioShippingJwt } from "@/lib/montonio/shipping-auth";
import type { MontonioPickupPointType } from "@/lib/shipping/pickup-carrier";

type MontonioPickupPoint = {
  id: string;
  name: string;
  type: string;
  streetAddress: string;
  locality: string;
  postalCode: string;
  carrierCode: string;
};

const cache = new Map<
  string,
  { fetchedAt: number; points: PickupPoint[] }
>();
const CACHE_MS = 1000 * 60 * 60;

const MONTONIO_CARRIER_TO_DISPLAY: Record<string, PickupCarrier> = {
  smartpost: "smartposti",
  omniva: "omniva",
  dpd: "dpd",
  gls: "gls",
  alzabox: "alzabox",
  novapost: "novapost",
};

function displayCarrierForMontonioCode(
  montonioCode: string,
  fallback: PickupCarrier,
): PickupCarrier {
  return MONTONIO_CARRIER_TO_DISPLAY[montonioCode.toLowerCase()] ?? fallback;
}

function mapMontonioPoint(
  point: MontonioPickupPoint,
  fallbackCarrier: PickupCarrier,
): PickupPoint {
  return {
    id: point.id,
    name: point.name,
    address: point.streetAddress,
    city: point.locality,
    postcode: point.postalCode,
    carrier: displayCarrierForMontonioCode(point.carrierCode, fallbackCarrier),
  };
}

export async function fetchMontonioPickupPointsByCode(input: {
  carrierCode: string;
  country: string;
  type?: MontonioPickupPointType;
  displayCarrier: PickupCarrier;
}) {
  const config = getMontonioConfig();
  if (!config.isConfigured || !config.accessKey || !config.secretKey) {
    return null;
  }

  const cacheKey = [
    input.carrierCode,
    input.country.toUpperCase(),
    input.type ?? "all",
  ].join(":");
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < CACHE_MS) {
    return cached.points;
  }

  const token = createMontonioShippingJwt(
    config.accessKey,
    config.secretKey,
  );
  const params = new URLSearchParams({
    carrierCode: input.carrierCode,
    countryCode: input.country.toUpperCase(),
  });

  if (input.type) {
    params.set("type", input.type);
  }

  const response = await fetch(
    `${config.shippingApiBase}/shipping-methods/pickup-points?${params}`,
    {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 60 * 60 },
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    pickupPoints?: MontonioPickupPoint[];
  };

  const points = (payload.pickupPoints ?? []).map((point) =>
    mapMontonioPoint(point, input.displayCarrier),
  );

  cache.set(cacheKey, { fetchedAt: now, points });
  return points;
}

export async function fetchMontonioPickupPoints(input: {
  carrier: PickupCarrier;
  country: string;
  type?: MontonioPickupPointType;
}) {
  const carrierCode =
    input.carrier === "smartposti"
      ? "smartpost"
      : input.carrier === "novapost"
        ? "novaPost"
        : input.carrier;

  return fetchMontonioPickupPointsByCode({
    carrierCode,
    country: input.country,
    type: input.type,
    displayCarrier: input.carrier,
  });
}
