import type { Locale } from "@/i18n/config";
import type { ProductSpec } from "@/types/catalog-product";

const SPEC_LABEL_ET: Record<string, string> = {
  "engine type": "Mootori tüüp",
  "engine capacity": "Mootori töömaht",
  "engine displacement": "Mootori töömaht",
  displacement: "Töömaht",
  "max. power": "Max võimsus",
  "max power": "Max võimsus",
  "maximum power": "Max võimsus",
  "max. torque": "Max pöördemoment",
  "max torque": "Max pöördemoment",
  "maximum torque": "Max pöördemoment",
  transmission: "Käigukast",
  ignition: "Süüde",
  starter: "Käiviti",
  brakes: "Pidurid",
  "brakes front": "Eesmine pidur",
  "brakes rear": "Tagumine pidur",
  "front wheel suspension": "Eesmine vedrustus",
  "rear wheel suspension": "Tagumine vedrustus",
  "front rim": "Eesmine velg",
  "rear rim": "Tagumine velg",
  "front tyre": "Eesmine rehv",
  "front tire": "Eesmine rehv",
  "rear tyre": "Tagumine rehv",
  "rear tire": "Tagumine rehv",
  "fuel type": "Kütusetüüp",
  "mass in running order": "Sõiduvalmis mass",
  "unladen weight": "Tühimass",
  "maximum laden weight": "Max koormusega mass",
  "permissible maximum weight": "Lubatud max kaal",
  length: "Pikkus",
  width: "Laius",
  height: "Kõrgus",
  "seat height": "Istme kõrgus",
  "ground clearance": "Läbipääs",
  seats: "Istekohad",
  "number of seats": "Istekohtade arv",
  "fuel tank maximum capacity": "Kütusepaagi maht",
  "tank capacity": "Paagi maht",
  "fuel consumption": "Kütusekulu",
  "fuel consumption*": "Kütusekulu",
  "kutusekulu*": "Kütusekulu",
  emissions: "Heitkogused",
  "emissions*": "Heitkogused",
  "co2 emissions": "CO₂ heitkogused",
  "co2 emmissions": "CO₂ heitkogused",
  "co2 heitkogused*": "CO₂ heitkogused",
  "standard equipment": "Standardvarustus",
  "top speed": "Tipkiirus",
  wheelbase: "Teljevahe",
  battery: "Aku",
  cooling: "Jahutus",
  cylinders: "Silindrid",
  "nominal power": "Nominaalvõimsus",
  chassis: "Raam",
  suspension: "Vedrustus",
  tyres: "Rehvid",
  tires: "Rehvid",
  rims: "Veljed",
  consumption: "Kütusekulu",
  range: "Ulatus",
  "mootori tuup": "Mootori tüüp",
  "mootori toomaht": "Mootori töömaht",
  pidurid: "Pidurid",
  sundimine: "Süüde",
  syude: "Süüde",
  esirehv: "Eesmine rehv",
  "tagumine rehv": "Tagumine rehv",
};

const SPEC_VALUE_ET: Record<string, string> = {
  "unleaded fuel only, ron/roz min. 95":
    "Ainult pliivaba kütus, RON/ROZ min 95",
  "gasoline (95 octane)": "Bensiin (95 oktaani)",
  "5-speed manual": "5-käiguline manuaal",
  "6-speed manual": "6-käiguline manuaal",
  "6-speed manual transmission": "6-käiguline manuaalkäigukast",
  "electric starter": "Elektriline käiviti",
  "disc / disc": "Ketas / ketas",
  "1 cylinder, 4-stroke, water cooled":
    "1 silinder, 4-taktiline, vesijahutusega",
};

const EDITORIAL_SECTION_ET: Record<string, string> = {
  design: "Disain",
  equipment: "Varustus",
  finishes: "Viimistlused",
};

function normalizeLabelKey(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\*+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function localizeMotorcycleSpecLabel(label: string, locale: Locale): string {
  if (locale !== "et") {
    return label;
  }

  const translated = SPEC_LABEL_ET[normalizeLabelKey(label)];

  return translated ?? label;
}

export function localizeMotorcycleSpecValue(value: string, locale: Locale): string {
  if (locale !== "et") {
    return value;
  }

  const key = normalizeLabelKey(value);
  const exact = SPEC_VALUE_ET[key];

  if (exact) {
    return exact;
  }

  const speedManual = key.match(/^(\d+)-speed manual( transmission)?$/);

  if (speedManual) {
    return `${speedManual[1]}-käiguline manuaal${speedManual[2] ? "käigukast" : ""}`;
  }

  return value;
}

export function localizeMotorcycleEditorialTitle(title: string, locale: Locale): string {
  if (locale !== "et") {
    return title;
  }

  return EDITORIAL_SECTION_ET[normalizeLabelKey(title)] ?? title;
}

export function localizeMotorcycleSpecs(
  specs: readonly ProductSpec[],
  locale: Locale,
): ProductSpec[] {
  return specs.map((spec) => ({
    ...spec,
    label: localizeMotorcycleSpecLabel(spec.label, locale),
    value: localizeMotorcycleSpecValue(spec.value, locale),
  }));
}

export function isHighlightSpecLabel(label: string) {
  const key = normalizeLabelKey(label);

  return /engine capacity|engine displacement|displacement|mootori toomaht|max\. power|max power|max voimsus|max\. torque|max torque|poordemoment|mass in running order|soiduvalmis mass|seat height|istme korgus/.test(
    key,
  );
}

export function specLabelCategoryBucket(label: string) {
  const key = normalizeLabelKey(label);

  if (
    /engine|power|torque|transmission|ignition|starter|capacity|displacement|fuel injection|efi|cylinder|stroke|nominal|fuel type|kutuse|mootor|motor|gearbox|voimsus|poordemoment|kaigukast|ulekanne|syude|sundimine|toomaht|maht|silinder|takt|jahutus|cooling|ecu/.test(
      key,
    )
  ) {
    return "engine" as const;
  }

  if (
    /dimension|mass|weight|length|width|height|seat|saddle|wheelbase|tank|running order|kerb|empty weight|pikkus|laius|korgus|istme|kaal|mood|paak|istekoht|piikkus/.test(
      key,
    )
  ) {
    return "dimension" as const;
  }

  return "extended" as const;
}
