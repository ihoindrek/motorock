import type { ShippingRate } from "@/lib/shop/shipping-method";

function rateHaystack(rate: ShippingRate) {
  return `${rate.methodId} ${rate.label} ${rate.id}`.toLowerCase();
}

export function isShowroomPickupRate(rate: ShippingRate) {
  const haystack = rateHaystack(rate);
  return (
    haystack.includes("local_pickup") ||
    haystack.includes("local pickup") ||
    haystack.includes("showroom") ||
    haystack.includes("pick up at store") ||
    haystack.includes("tulen ise")
  );
}

export function isVenipakRate(rate: ShippingRate) {
  return rateHaystack(rate).includes("venipak");
}

export function findShowroomPickupRate(rates: readonly ShippingRate[]) {
  return rates.find(isShowroomPickupRate) ?? null;
}

/** Woo zones should already scope pickup; this guards against stale client state. */
export function filterShippingRatesForCountry(
  rates: readonly ShippingRate[],
  country: string,
) {
  const withoutVenipak = rates.filter((rate) => !isVenipakRate(rate));

  if (country === "EE") {
    return withoutVenipak;
  }

  return withoutVenipak.filter((rate) => !isShowroomPickupRate(rate));
}
