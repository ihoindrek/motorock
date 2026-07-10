import type { PickupPoint } from "@/types/pickup-point";
import type {
  MontonioPickupPointType,
  PickupPointSource,
} from "@/lib/shipping/pickup-carrier";
import { fetchMontonioPickupPointsByCode, enrichPickupPointsWithMontonioIds } from "@/lib/montonio/pickup-points";
import { getMontonioConfig } from "@/lib/montonio/config";
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
    case "novapost":
      return [];
    default:
      return [];
  }
}

async function fetchSourcePoints(
  source: PickupPointSource,
  country: string,
  sources: PickupPointSource[],
  preferMontonioOnly: boolean,
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

  const fallback = await fetchPublicFallbackPoints(source, country, sources);

  if (!preferMontonioOnly) {
    return fallback;
  }

  const enriched = await enrichPickupPointsWithMontonioIds(fallback, {
    carrierCode: source.montonioCode,
    country,
    displayCarrier: source.carrier,
  });

  return enriched.filter((point) => point.montonioItemId);
}

function buildMontonioPickupError() {
  const config = getMontonioConfig();

  if (!config.isConfigured) {
    return "Montonio API võtmed puuduvad serveris. Lisa MONTONIO_ACCESS_KEY ja MONTONIO_SECRET_KEY.";
  }

  if (config.environment === "sandbox") {
    return "Montonio sandbox ei sisalda pakiautomaate. Sea serveris MONTONIO_ENV=production ja kasuta production võtmeid.";
  }

  return "Pakiautomaate ei õnnestunud Montonio kaudu laadida. Kontrolli WooCommerce Montonio shipping synci.";
}

async function fetchPickupSources(
  sources: PickupPointSource[],
  country: string,
  preferMontonioOnly: boolean,
) {
  const batches = await Promise.all(
    sources.map((source) =>
      fetchSourcePoints(source, country, sources, preferMontonioOnly),
    ),
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
  preferMontonioOnly?: boolean;
}) {
  const query = normalizeQuery(input.query ?? "");
  const limit = input.limit ?? 100;
  const sources = input.sources.length > 0 ? input.sources : [];
  const preferMontonioOnly = input.preferMontonioOnly ?? false;

  const points = await fetchPickupSources(
    sources,
    input.country,
    preferMontonioOnly,
  );

  if (preferMontonioOnly && points.length === 0) {
    throw new Error(buildMontonioPickupError());
  }

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
