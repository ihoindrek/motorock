import type { PickupPoint } from "@/types/pickup-point";
import type { MontonioPickupPointType } from "@/lib/shipping/pickup-carrier";
import { fetchGlsPickupPoints } from "@/lib/shipping/pickup-points/gls";

const ALZABOX_COUNTRIES = new Set(["CZ", "SK", "HU"]);

export async function fetchAlzaboxPickupPoints(
  country: string,
  type?: MontonioPickupPointType,
) {
  const iso = country.toUpperCase();

  if (!ALZABOX_COUNTRIES.has(iso) || type === "parcelShop") {
    return [];
  }

  const lockers = await fetchGlsPickupPoints(country, "parcelMachine");

  return lockers
    .filter((point) => /alzabox/i.test(point.name))
    .map(
      (point): PickupPoint => ({
        ...point,
        carrier: "alzabox",
      }),
    );
}
