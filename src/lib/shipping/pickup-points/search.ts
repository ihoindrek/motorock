import type { PickupPoint } from "@/types/pickup-point";
import type {
  MontonioPickupPointType,
  PickupPointSource,
} from "@/lib/shipping/pickup-carrier";
import { fetchMontonioPickupPointsByCode } from "@/lib/montonio/pickup-points";
import { fetchAlzaboxPickupPoints } from "@/lib/shipping/pickup-points/alzabox";
import { fetchDpdPickupPoints } from "@/lib/shipping/pickup-points/dpd";
import {
  fetchDpdInternationalPickupPoints,
  isDpdBalticsCountry,
} from "@/lib/shipping/pickup-points/dpd-international";
import { fetchGlsPickupPoints } from "@/lib/shipping/pickup-points/gls";
import { fetchOmnivaPickupPoints } from "@/lib/shipping/pickup-points/omniva";
import { fetchSmartpostiPickupPoints } from "@/lib/shipping/pickup-points/smartposti";

const BALTIC_COUNTRIES = new Set(["EE", "LV", "LT"]);

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

function matchesQuery(point: PickupPoint, query: string) {
  if (!query) {
    return true;
  }

  const haystack =
    `${point.name} ${point.address} ${point.city} ${point.postcode}`.toLowerCase();
  return haystack.includes(query);
}

async function fetchPublicFallbackPoints(
  source: PickupPointSource,
  country: string,
  allSources: PickupPointSource[],
) {
  const hasAlzaboxSource = allSources.some(
    (item) => item.carrier === "alzabox",
  );

  switch (source.carrier) {
    case "gls":
      return fetchGlsPickupPoints(country, source.pickupType, {
        excludeAlzabox: hasAlzaboxSource,
      });
    case "alzabox":
      return fetchAlzaboxPickupPoints(country, source.pickupType);
    case "omniva":
      return fetchOmnivaPickupPoints(country);
    case "smartposti":
      if (!BALTIC_COUNTRIES.has(country.toUpperCase())) {
        return [];
      }
      return fetchSmartpostiPickupPoints(country);
    case "dpd":
      if (isDpdBalticsCountry(country)) {
        return fetchDpdPickupPoints(country);
      }
      return fetchDpdInternationalPickupPoints(country, source.pickupType);
    default:
      return [];
  }
}

async function fetchSourcePoints(
  source: PickupPointSource,
  country: string,
  sources: PickupPointSource[],
) {
  const montonioPoints = await fetchMontonioPickupPointsByCode({
    carrierCode: source.montonioCode,
    country,
    type: source.pickupType,
    displayCarrier: source.carrier,
  });

  if (montonioPoints && montonioPoints.length > 0) {
    return montonioPoints;
  }

  return fetchPublicFallbackPoints(source, country, sources);
}

async function fetchPickupSources(
  sources: PickupPointSource[],
  country: string,
) {
  const batches = await Promise.all(
    sources.map((source) => fetchSourcePoints(source, country, sources)),
  );

  const seen = new Set<string>();
  const merged: PickupPoint[] = [];

  for (const points of batches) {
    for (const point of points) {
      const key = `${point.carrier}:${point.id}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      merged.push(point);
    }
  }

  return merged;
}

export async function searchPickupPoints(input: {
  sources: PickupPointSource[];
  country: string;
  query?: string;
  limit?: number;
  type?: MontonioPickupPointType;
}) {
  const query = normalizeQuery(input.query ?? "");
  const limit = input.limit ?? 100;
  const sources = input.sources.length > 0 ? input.sources : [];

  const points = await fetchPickupSources(sources, input.country);

  const filtered = points
    .filter((point) => matchesQuery(point, query))
    .sort((left, right) => {
      if (!query) {
        return (
          left.city.localeCompare(right.city, "en") ||
          left.name.localeCompare(right.name, "en")
        );
      }

      const leftStarts = left.name.toLowerCase().startsWith(query) ? 0 : 1;
      const rightStarts = right.name.toLowerCase().startsWith(query) ? 0 : 1;
      if (leftStarts !== rightStarts) {
        return leftStarts - rightStarts;
      }

      return left.name.localeCompare(right.name, "en");
    });

  return filtered.slice(0, limit);
}
