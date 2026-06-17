import type { ShippingRate } from "@/lib/shop/shipping-method";

const MONTONIO_CARRIER_ICONS =
  "https://motorock.eu/wp-content/plugins/montonio-for-woocommerce/assets/images";

export type ShippingMethodVisual =
  | { kind: "logo"; src: string; alt: string }
  | { kind: "icon"; icon: "parcel" | "courier" | "pickup" | "store" };

export function resolveShippingMethodVisual(
  rate: ShippingRate,
): ShippingMethodVisual {
  const methodId = rate.methodId.toLowerCase();
  const label = rate.label.toLowerCase();
  const rateId = rate.id.toLowerCase();
  const haystack = `${methodId} ${label} ${rateId}`;

  if (methodId === "local_pickup" || label.includes("local pickup")) {
    return { kind: "icon", icon: "store" };
  }

  if (methodId === "flat_rate" || label.includes("by agreement")) {
    return { kind: "icon", icon: "pickup" };
  }

  if (haystack.includes("smartposti") || haystack.includes("itella")) {
    return {
      kind: "logo",
      src: `${MONTONIO_CARRIER_ICONS}/smartposti.svg`,
      alt: "SmartPosti",
    };
  }

  if (haystack.includes("dpd")) {
    return {
      kind: "logo",
      src: `${MONTONIO_CARRIER_ICONS}/dpd.svg`,
      alt: "DPD",
    };
  }

  if (haystack.includes("venipak")) {
    return {
      kind: "logo",
      src: `${MONTONIO_CARRIER_ICONS}/venipak.svg`,
      alt: "Venipak",
    };
  }

  if (haystack.includes("omniva") || haystack.includes("omnivalt")) {
    return {
      kind: "logo",
      src: `${MONTONIO_CARRIER_ICONS}/omniva.svg`,
      alt: "Omniva",
    };
  }

  if (
    haystack.includes("courier") ||
    haystack.includes("kuller") ||
    methodId.includes("international_shipping_courier")
  ) {
    return { kind: "icon", icon: "courier" };
  }

  if (
    haystack.includes("parcel") ||
    haystack.includes("pickup") ||
    haystack.includes("terminal") ||
    haystack.includes("pakiautomaat")
  ) {
    return { kind: "icon", icon: "parcel" };
  }

  return { kind: "icon", icon: "pickup" };
}
