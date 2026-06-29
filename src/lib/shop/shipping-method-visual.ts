import type { ShippingRate } from "@/lib/shop/shipping-method";

/** Same carrier artwork as Montonio for WooCommerce checkout (`*-rect.svg`). */
const MONTONIO_CARRIER_ICONS =
  "https://motorock.eu/wp-content/plugins/montonio-for-woocommerce/assets/images";

export type ShippingMethodVisual =
  | { kind: "logo"; src: string; alt: string }
  | { kind: "logos"; items: Array<{ src: string; alt: string }> }
  | { kind: "icon"; icon: "parcel" | "courier" | "pickup" | "store" };

const CARRIER_LOGOS: Record<string, { file: string; alt: string }> = {
  smartposti: { file: "smartposti-rect.svg", alt: "SmartPosti" },
  itella: { file: "smartposti-rect.svg", alt: "SmartPosti" },
  omniva: { file: "omniva-rect.svg", alt: "Omniva" },
  dpd: { file: "dpd-rect.svg", alt: "DPD" },
  venipak: { file: "venipak-rect.svg", alt: "Venipak" },
  unisend: { file: "unisend-rect.svg", alt: "Unisend" },
  inpost: { file: "inpost-rect.svg", alt: "InPost" },
  orlen: { file: "orlen-rect.svg", alt: "Orlen" },
  dhl: { file: "dhl-rect.svg", alt: "DHL" },
  gls: { file: "gls-rect.svg", alt: "GLS" },
  alzabox: { file: "alzabox-rect.svg", alt: "AlzaBox" },
  novapost: { file: "novaPost-rect.svg", alt: "Nova Post" },
};

function carrierLogo(
  carrier: keyof typeof CARRIER_LOGOS,
): ShippingMethodVisual {
  const logo = CARRIER_LOGOS[carrier];
  return {
    kind: "logo",
    src: `${MONTONIO_CARRIER_ICONS}/${logo.file}`,
    alt: logo.alt,
  };
}

function carrierLogos(
  carriers: Array<keyof typeof CARRIER_LOGOS>,
): ShippingMethodVisual {
  return {
    kind: "logos",
    items: carriers.map((carrier) => {
      const logo = CARRIER_LOGOS[carrier];
      return {
        src: `${MONTONIO_CARRIER_ICONS}/${logo.file}`,
        alt: logo.alt,
      };
    }),
  };
}

function montonioCarrierFromMethodId(methodId: string) {
  const match = methodId.match(
    /montonio_(itella|smartposti|omniva|dpd|venipak|unisend|inpost|orlen|dhl|gls)(?:_|$)/,
  );
  return match?.[1] as keyof typeof CARRIER_LOGOS | undefined;
}

function carrierFromHaystack(haystack: string) {
  if (haystack.includes("smartposti") || haystack.includes("itella")) {
    return "smartposti" as const;
  }
  if (haystack.includes("omniva") || haystack.includes("omnivalt")) {
    return "omniva" as const;
  }
  if (haystack.includes("dpd")) {
    return "dpd" as const;
  }
  if (haystack.includes("venipak")) {
    return "venipak" as const;
  }
  if (haystack.includes("unisend")) {
    return "unisend" as const;
  }
  if (haystack.includes("inpost")) {
    return "inpost" as const;
  }
  if (haystack.includes("orlen")) {
    return "orlen" as const;
  }
  if (/\bdhl\b/.test(haystack)) {
    return "dhl" as const;
  }
  if (haystack.includes("gls")) {
    return "gls" as const;
  }
  if (haystack.includes("alzabox") || haystack.includes("alza")) {
    return "alzabox" as const;
  }
  if (haystack.includes("novapost") || haystack.includes("nova post")) {
    return "novapost" as const;
  }

  return null;
}

function internationalShippingVisual(rate: ShippingRate): ShippingMethodVisual | null {
  const methodId = rate.methodId.toLowerCase();
  const label = rate.label.toLowerCase();
  const rateId = rate.id.toLowerCase();

  if (!methodId.includes("international_shipping")) {
    return null;
  }

  if (methodId.includes("courier") || label === "courier") {
    return carrierLogo("novapost");
  }

  if (label.includes("locker") || rateId.includes("parcelmachine")) {
    return carrierLogos(["alzabox", "gls"]);
  }

  if (label.includes("shop") || rateId.includes("parcelshop")) {
    return carrierLogo("gls");
  }

  return carrierLogo("gls");
}

export function resolveShippingMethodVisual(
  rate: ShippingRate,
): ShippingMethodVisual {
  const methodId = rate.methodId.toLowerCase();
  const label = rate.label.toLowerCase();
  const rateId = rate.id.toLowerCase();
  const haystack = `${methodId} ${label} ${rateId}`;

  const internationalVisual = internationalShippingVisual(rate);
  if (internationalVisual) {
    return internationalVisual;
  }

  if (methodId === "local_pickup" || label.includes("local pickup")) {
    return { kind: "icon", icon: "store" };
  }

  if (methodId === "flat_rate" || label.includes("by agreement")) {
    return { kind: "icon", icon: "pickup" };
  }

  const montonioCarrier = montonioCarrierFromMethodId(methodId);
  if (montonioCarrier) {
    return carrierLogo(montonioCarrier);
  }

  const carrier = carrierFromHaystack(haystack);
  if (carrier) {
    return carrierLogo(carrier);
  }

  if (
    haystack.includes("courier") ||
    haystack.includes("kuller")
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
