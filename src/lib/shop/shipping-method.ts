export type ShippingRate = {
  id: string;
  label: string;
  cost: string | null;
  methodId: string;
  instanceId: number | null;
};

export function parseShippingRateCost(cost: string | null | undefined) {
  if (!cost) {
    return 0;
  }

  const parsed = Number.parseFloat(cost);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Parcel locker / pickup — no street address needed at checkout. */
export function shippingMethodNeedsAddress(rate: ShippingRate) {
  const methodId = rate.methodId.toLowerCase();
  const label = rate.label.toLowerCase();
  const rateId = rate.id.toLowerCase();

  if (methodId === "local_pickup" || methodId === "flat_rate") {
    return false;
  }

  if (
    methodId.includes("parcel_machine") ||
    methodId.includes("pickup_point") ||
    methodId.includes("pickup_points") ||
    methodId.includes("parcel_shop") ||
    rateId.includes("omnivalt_pt") ||
    rateId.includes("parcelshop")
  ) {
    return false;
  }

  if (
    label.includes("parcel machine") ||
    label.includes("parcel terminal") ||
    label.includes("parcel shop") ||
    label.includes("pickup point") ||
    label.includes("pakiautomaat")
  ) {
    return false;
  }

  if (
    methodId.includes("courier") ||
    label.includes("courier") ||
    label.includes("kuller")
  ) {
    return true;
  }

  if (methodId.includes("international_shipping_courier")) {
    return true;
  }

  return !label.includes("parcel") && !label.includes("pickup");
}
