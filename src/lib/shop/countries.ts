const displayNames =
  typeof Intl !== "undefined"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

export function countryLabel(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return code.trim();
  }

  try {
    return displayNames?.of(normalized) ?? normalized;
  } catch {
    return normalized;
  }
}

/** EE first on Estonian checkout; otherwise strict alphabetical order. */
export function preferredCheckoutCountry(locale?: string) {
  return locale === "et" ? "EE" : undefined;
}

export function sortCountryCodes(codes: readonly string[], preferred?: string | null) {
  const unique = [...new Set(codes)];
  unique.sort((left, right) => {
    if (preferred) {
      if (left === preferred) {
        return -1;
      }
      if (right === preferred) {
        return 1;
      }
    }
    return countryLabel(left).localeCompare(countryLabel(right), "en");
  });
  return unique;
}

/** Used only to fetch shipping rates before a courier address is entered. */
export const DEFAULT_LOCATION_BY_COUNTRY: Record<
  string,
  { postcode: string; city: string }
> = {
  EE: { postcode: "10111", city: "Tallinn" },
  LV: { postcode: "LV-1050", city: "Riga" },
  LT: { postcode: "01108", city: "Vilnius" },
  FI: { postcode: "00100", city: "Helsinki" },
  SE: { postcode: "111 22", city: "Stockholm" },
  NO: { postcode: "0150", city: "Oslo" },
  DE: { postcode: "10115", city: "Berlin" },
  FR: { postcode: "75001", city: "Paris" },
  PL: { postcode: "00-001", city: "Warsaw" },
  NL: { postcode: "1012", city: "Amsterdam" },
  BE: { postcode: "1000", city: "Brussels" },
  IT: { postcode: "00118", city: "Rome" },
  ES: { postcode: "28001", city: "Madrid" },
  AT: { postcode: "1010", city: "Vienna" },
  DK: { postcode: "1050", city: "Copenhagen" },
  CZ: { postcode: "110 00", city: "Prague" },
  SK: { postcode: "811 01", city: "Bratislava" },
  HU: { postcode: "1051", city: "Budapest" },
  RO: { postcode: "010011", city: "Bucharest" },
  BG: { postcode: "1000", city: "Sofia" },
  HR: { postcode: "10000", city: "Zagreb" },
  SI: { postcode: "1000", city: "Ljubljana" },
  IE: { postcode: "D01", city: "Dublin" },
  PT: { postcode: "1100-148", city: "Lisbon" },
  LU: { postcode: "1111", city: "Luxembourg" },
};

export function defaultLocationForCountry(country: string) {
  const normalized = country.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return DEFAULT_LOCATION_BY_COUNTRY.EE;
  }

  return (
    DEFAULT_LOCATION_BY_COUNTRY[normalized] ?? {
      postcode: "00000",
      city: countryLabel(normalized),
    }
  );
}

/** True when postcode looks complete enough to fetch courier shipping rates. */
export function isPostcodeReadyForShipping(country: string, postcode: string) {
  const normalized = postcode.trim().replace(/\s+/g, "");
  if (!normalized) {
    return false;
  }

  switch (country.toUpperCase()) {
    case "EE":
    case "LT":
      return /^\d{5}$/.test(normalized);
    case "LV":
      return /^(LV-)?\d{4}$/i.test(normalized);
    default:
      return normalized.length >= 3;
  }
}

export function isDeliveryAddressReady(
  country: string,
  address: { address1: string; city: string; postcode: string },
) {
  const address1 = address.address1.trim();
  const city = address.city.trim();

  return (
    address1.length >= 2 &&
    city.length >= 2 &&
    isPostcodeReadyForShipping(country, address.postcode)
  );
}
