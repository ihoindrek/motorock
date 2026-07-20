import type { Locale } from "@/i18n/config";
import type { ShippingRate } from "@/lib/shop/shipping-method";

type ShippingRateLabelSource = Pick<ShippingRate, "label" | "methodId" | "id">;

/**
 * Exact / phrase replacements for common Woo + Montonio shipping titles.
 * Matched case-insensitively; longer phrases first.
 */
const ET_PHRASE_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/transport by agreement/gi, "Transport kokkuleppel"],
  [/by agreement/gi, "kokkuleppel"],
  [/local pickup/gi, "Tulen ise järgi"],
  [/free shipping/gi, "Tasuta tarne"],
  [/parcel machines?/gi, "pakiautomaat"],
  [/parcel terminals?/gi, "pakiautomaat"],
  [/parcel shops?/gi, "pakipood"],
  [/pickup points?/gi, "väljastupunkt"],
  [/pick-?up points?/gi, "väljastupunkt"],
  [/\bcourier\b/gi, "kuller"],
  [/\bhome delivery\b/gi, "kojutoimetamine"],
  [/\binternational shipping\b/gi, "Rahvusvaheline tarne"],
];

function applyEtPhraseReplacements(label: string) {
  let next = label;

  for (const [pattern, replacement] of ET_PHRASE_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  // Normalize doubled spaces and capitalize first letter.
  next = next.replace(/\s+/g, " ").trim();
  if (!next) {
    return label;
  }

  return next.charAt(0).toUpperCase() + next.slice(1);
}

function fallbackEtLabel(rate: ShippingRateLabelSource) {
  const haystack = `${rate.methodId} ${rate.id} ${rate.label}`.toLowerCase();

  if (haystack.includes("local_pickup") || haystack.includes("local pickup")) {
    return "Tulen ise järgi";
  }

  if (haystack.includes("by agreement") || haystack.includes("kokkuleppel")) {
    return "Transport kokkuleppel";
  }

  if (
    haystack.includes("parcel_machine") ||
    haystack.includes("parcel machine") ||
    haystack.includes("pakiautomaat")
  ) {
    if (haystack.includes("omniva")) {
      return "Omniva pakiautomaat";
    }
    if (haystack.includes("dpd")) {
      return "DPD pakiautomaat";
    }
    if (haystack.includes("smartposti") || haystack.includes("itella")) {
      return "Smartposti pakiautomaat";
    }
    if (haystack.includes("venipak")) {
      return "Venipak pakiautomaat";
    }
  }

  if (haystack.includes("courier") || haystack.includes("kuller")) {
    if (haystack.includes("omniva")) {
      return "Omniva kuller";
    }
    if (haystack.includes("dpd")) {
      return "DPD kuller";
    }
    if (haystack.includes("smartposti") || haystack.includes("itella")) {
      return "Smartposti kuller";
    }
  }

  return null;
}

/** Display label for checkout UI; keeps Woo EN titles mapped for ET locale. */
export function localizeShippingRateLabel(
  rate: ShippingRateLabelSource,
  locale: Locale,
) {
  if (locale !== "et") {
    return rate.label;
  }

  const fromPhrases = applyEtPhraseReplacements(rate.label);
  if (fromPhrases.toLowerCase() !== rate.label.toLowerCase()) {
    return fromPhrases;
  }

  return fallbackEtLabel(rate) ?? rate.label;
}
