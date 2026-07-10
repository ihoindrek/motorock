import type { PickupCarrier } from "@/types/pickup-point";
import type { ShippingRate } from "@/lib/shop/shipping-method";
import { isShowroomPickupRate } from "@/lib/shop/shipping-showroom-pickup";
import { shippingMethodNeedsAddress } from "@/lib/shop/shipping-method";

export type MontonioPickupPointType =
  | "parcelMachine"
  | "parcelShop"
  | "postOffice";

export type PickupPointSource = {
  montonioCode: string;
  pickupType?: MontonioPickupPointType;
  carrier: PickupCarrier;
};

export function shippingMethodNeedsPickupPoint(rate: ShippingRate | null) {
  if (!rate || isShowroomPickupRate(rate)) {
    return false;
  }

  return !shippingMethodNeedsAddress(rate);
}

function isInternationalPickupRate(rate: ShippingRate) {
  return rate.methodId
    .toLowerCase()
    .includes("international_shipping_pickup_points");
}

const INTERNATIONAL_CARRIER_BY_KEY: Record<
  string,
  { montonioCode: string; carrier: PickupCarrier }
> = {
  novapost: { montonioCode: "novaPost", carrier: "novapost" },
  gls: { montonioCode: "gls", carrier: "gls" },
  alzabox: { montonioCode: "alzabox", carrier: "alzabox" },
  dpd: { montonioCode: "dpd", carrier: "dpd" },
  smartpost: { montonioCode: "smartpost", carrier: "smartposti" },
  omniva: { montonioCode: "omniva", carrier: "omniva" },
};

/** Woo rate ids look like `...:71:novaPost_parcelMachine`. */
function parseInternationalPickupSource(rate: ShippingRate): PickupPointSource | null {
  const suffix = rate.id.includes(":")
    ? rate.id.split(":").slice(2).join(":")
    : "";
  const match = suffix.match(/^([a-z]+)_(parcelmachine|parcelshop|postoffice)$/i);

  if (!match) {
    return null;
  }

  const carrierKey = match[1].toLowerCase();
  const mapping = INTERNATIONAL_CARRIER_BY_KEY[carrierKey];

  if (!mapping) {
    return null;
  }

  const subtype = match[2].toLowerCase();
  const pickupType: MontonioPickupPointType =
    subtype === "parcelshop"
      ? "parcelShop"
      : subtype === "postoffice"
        ? "postOffice"
        : "parcelMachine";

  return {
    montonioCode: mapping.montonioCode,
    pickupType,
    carrier: mapping.carrier,
  };
}

function resolveInternationalPickupSources(rate: ShippingRate): PickupPointSource[] {
  const parsed = parseInternationalPickupSource(rate);
  if (parsed) {
    return [parsed];
  }

  const label = rate.label.toLowerCase();
  const rateId = rate.id.toLowerCase();

  const isLockers =
    label.includes("locker") || rateId.includes("parcelmachine");
  const isShops = label.includes("shop") && !isLockers;

  if (isLockers) {
    return [
      {
        montonioCode: "alzabox",
        pickupType: "parcelMachine",
        carrier: "alzabox",
      },
      {
        montonioCode: "gls",
        pickupType: "parcelMachine",
        carrier: "gls",
      },
    ];
  }

  if (isShops) {
    return [
      {
        montonioCode: "gls",
        pickupType: "parcelShop",
        carrier: "gls",
      },
    ];
  }

  return [
    { montonioCode: "gls", carrier: "gls" },
    { montonioCode: "alzabox", carrier: "alzabox" },
  ];
}

export function resolvePickupPointSources(
  rate: ShippingRate,
  country: string,
): PickupPointSource[] | null {
  if (!shippingMethodNeedsPickupPoint(rate)) {
    return null;
  }

  if (isInternationalPickupRate(rate)) {
    return resolveInternationalPickupSources(rate);
  }

  const haystack = `${rate.methodId} ${rate.label} ${rate.id}`.toLowerCase();
  const pickupType = resolveMontonioPickupPointType(rate);

  if (haystack.includes("smartposti") || haystack.includes("itella")) {
    return [
      {
        montonioCode: "smartpost",
        carrier: "smartposti",
        pickupType: pickupType ?? "parcelMachine",
      },
    ];
  }

  if (haystack.includes("dpd")) {
    return [
      {
        montonioCode: "dpd",
        carrier: "dpd",
        pickupType,
      },
    ];
  }

  if (haystack.includes("omniva") || haystack.includes("omnivalt")) {
    return [
      {
        montonioCode: "omniva",
        carrier: "omniva",
        pickupType: pickupType ?? "parcelMachine",
      },
    ];
  }

  if (haystack.includes("parcel") || haystack.includes("pakiautomaat")) {
    if (country === "EE" || country === "LV" || country === "LT") {
      return [{ montonioCode: "omniva", carrier: "omniva" }];
    }
  }

  return null;
}

/** @deprecated Use resolvePickupPointSources — kept for legacy call sites. */
export function resolvePickupCarrier(
  rate: ShippingRate,
  country: string,
): PickupCarrier | null {
  return resolvePickupPointSources(rate, country)?.[0]?.carrier ?? null;
}

export function resolveMontonioPickupPointType(
  rate: ShippingRate,
): MontonioPickupPointType | undefined {
  const haystack = `${rate.methodId} ${rate.label} ${rate.id}`.toLowerCase();

  if (
    haystack.includes("parcel_shop") ||
    haystack.includes("parcel_shops") ||
    haystack.includes("parcelshop") ||
    (haystack.includes("parcel shop") && !haystack.includes("locker"))
  ) {
    return "parcelShop";
  }

  if (
    haystack.includes("parcel_machine") ||
    haystack.includes("parcel_machines") ||
    haystack.includes("parcelmachine") ||
    haystack.includes("parcel locker")
  ) {
    return "parcelMachine";
  }

  if (haystack.includes("post_office")) {
    return "postOffice";
  }

  return undefined;
}
