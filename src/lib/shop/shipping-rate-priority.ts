import type { ShippingRate } from "@/lib/shop/shipping-method";
import { parseShippingRateCost, shippingMethodNeedsAddress } from "@/lib/shop/shipping-method";

function rateHaystack(rate: ShippingRate) {
  return `${rate.methodId} ${rate.label} ${rate.id}`.toLowerCase();
}

export function scoreShippingRate(rate: ShippingRate) {
  const haystack = rateHaystack(rate);
  let score = 0;

  if (haystack.includes("local_pickup") || haystack.includes("local pickup")) {
    score += 95;
  } else if (haystack.includes("omniva") && haystack.includes("parcel")) {
    score += 100;
  } else if (haystack.includes("dpd") && haystack.includes("parcel")) {
    score += 90;
  } else if (
    (haystack.includes("smartposti") || haystack.includes("itella")) &&
    haystack.includes("parcel")
  ) {
    score += 85;
  } else if (!shippingMethodNeedsAddress(rate)) {
    score += 60;
  } else if (shippingMethodNeedsAddress(rate)) {
    score += 40;
  }

  if (parseShippingRateCost(rate.cost) === 0) {
    score += 5;
  }

  return score;
}

export function sortShippingRates(rates: readonly ShippingRate[]) {
  return [...rates].sort((left, right) => {
    const scoreDiff = scoreShippingRate(right) - scoreShippingRate(left);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return (
      parseShippingRateCost(left.cost) - parseShippingRateCost(right.cost)
    );
  });
}

export function pickDefaultShippingRateId(rates: readonly ShippingRate[]) {
  return sortShippingRates(rates)[0]?.id ?? null;
}

export function splitFeaturedShippingRates(
  rates: readonly ShippingRate[],
  limit = 3,
) {
  const sorted = sortShippingRates(rates);
  const featured = sorted.slice(0, limit);
  const featuredIds = new Set(featured.map((rate) => rate.id));
  const rest = rates.filter((rate) => !featuredIds.has(rate.id));

  return {
    featured,
    rest,
    showToggle: rest.length > 0,
  };
}

export function shippingGroupLabel(rate: ShippingRate) {
  const haystack = rateHaystack(rate);
  if (haystack.includes("local_pickup") || haystack.includes("local pickup")) {
    return "Showroom";
  }

  if (shippingMethodNeedsAddress(rate)) {
    return "Courier";
  }

  if (haystack.includes("flat_rate") || haystack.includes("by agreement")) {
    return "Other";
  }

  return "Parcel locker";
}
