const COUNTRY_DIAL_CODE: Record<string, string> = {
  AT: "43",
  BE: "32",
  BG: "359",
  CH: "41",
  CY: "357",
  CZ: "420",
  DE: "49",
  DK: "45",
  EE: "372",
  ES: "34",
  FI: "358",
  FR: "33",
  GB: "44",
  GR: "30",
  HR: "385",
  HU: "36",
  IE: "353",
  IT: "39",
  LT: "370",
  LU: "352",
  LV: "371",
  MT: "356",
  NL: "31",
  NO: "47",
  PL: "48",
  PT: "351",
  RO: "40",
  SE: "46",
  SI: "386",
  SK: "421",
};

export const PHONE_COUNTRY_CODES = Object.keys(COUNTRY_DIAL_CODE);

export function countryFlagEmoji(code: string) {
  const normalized = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return "🏳️";
  }

  return String.fromCodePoint(
    ...[...normalized].map((char) => 0x1f1e6 - 65 + char.charCodeAt(0)),
  );
}

export function countryDialCode(country: string) {
  return COUNTRY_DIAL_CODE[country.toUpperCase()] ?? null;
}

export function countryPhonePrefix(country: string) {
  const dialCode = countryDialCode(country);
  return dialCode ? `+${dialCode}` : null;
}

export function stripCountryDialCode(country: string, value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  const dialCode = countryDialCode(country);
  if (!dialCode) {
    return digits.replace(/^0+/, "");
  }

  if (digits.startsWith(dialCode)) {
    return digits.slice(dialCode.length).replace(/^0+/, "");
  }

  if (digits.startsWith(`00${dialCode}`)) {
    return digits.slice(2 + dialCode.length).replace(/^0+/, "");
  }

  return digits.replace(/^0+/, "");
}

export function formatPhoneWithCountryCode(country: string, nationalValue: string) {
  const digits = nationalValue.replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  const dialCode = countryDialCode(country);
  if (!dialCode) {
    return digits;
  }

  return `+${dialCode}${digits}`;
}

export function isValidCheckoutPhone(country: string, nationalValue: string) {
  const digits = nationalValue.replace(/\D/g, "");
  if (!digits) {
    return false;
  }

  const dialCode = countryDialCode(country);
  if (!dialCode) {
    return digits.length >= 6;
  }

  if (dialCode === "372") {
    return digits.length >= 7 && digits.length <= 8;
  }

  return digits.length >= 6 && digits.length <= 12;
}
