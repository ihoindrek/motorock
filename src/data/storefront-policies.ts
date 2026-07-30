import type { Locale } from "@/i18n/config";
import { SHOWROOM } from "@/data/showroom";

export const POLICY_EMAILS = {
  shop: SHOWROOM.email,
  returns: SHOWROOM.email,
  warranty: SHOWROOM.email,
  support: SHOWROOM.email,
} as const;

export const POLICY_PHONE = SHOWROOM.phone;

export const ORDER_PROCESSING_DAYS = { en: "1–2 business days", et: "1–2 tööpäeva" };

export const DELIVERY_TIMES = {
  estonia: { en: "Estonia: 3–7 working days", et: "Eesti: 3–7 tööpäeva" },
  baltics: {
    en: "Latvia & Lithuania: 3–7 working days",
    et: "Läti ja Leedu: 3–7 tööpäeva",
  },
  finland: { en: "Finland: 3–5 working days", et: "Soome: 3–5 tööpäeva" },
  eu: {
    en: "Other EU countries: 10–14 calendar days",
    et: "Muud ELi riigid: 10–14 kalendripäeva",
  },
} as const;

type LocalizedCopy = Record<Locale, string>;
type LocalizedBullets = Record<Locale, readonly string[]>;

export type ShippingRegion = {
  id: string;
  title: LocalizedCopy;
  methods: LocalizedBullets;
  deliveryTime: LocalizedCopy;
};

export type PaymentRegion = {
  id: string;
  title: LocalizedCopy;
  methods: LocalizedBullets;
};

/** Matches checkout shipping zones and Montonio pickup/carrier support. */
export const SHIPPING_REGIONS: readonly ShippingRegion[] = [
  {
    id: "estonia",
    title: { en: "Estonia", et: "Eesti" },
    methods: {
      en: [
        "SmartPosti parcel locker",
        "Omniva parcel locker",
        "DPD parcel locker",
        "Courier delivery (Omniva, DPD)",
        `Showroom pickup — ${SHOWROOM.addressLine}, ${SHOWROOM.city}`,
      ],
      et: [
        "SmartPosti pakiautomaat",
        "Omniva pakiautomaat",
        "DPD pakiautomaat",
        "Kullertarne (Omniva, DPD)",
        `Salongist kättesaamine — ${SHOWROOM.addressLine}, ${SHOWROOM.city}`,
      ],
    },
    deliveryTime: DELIVERY_TIMES.estonia,
  },
  {
    id: "latvia-lithuania",
    title: { en: "Latvia & Lithuania", et: "Läti ja Leedu" },
    methods: {
      en: [
        "SmartPosti parcel locker",
        "Omniva parcel locker",
        "DPD parcel locker",
        "Courier delivery (Omniva, DPD)",
      ],
      et: [
        "SmartPosti pakiautomaat",
        "Omniva pakiautomaat",
        "DPD pakiautomaat",
        "Kullertarne (Omniva, DPD)",
      ],
    },
    deliveryTime: DELIVERY_TIMES.baltics,
  },
  {
    id: "finland",
    title: { en: "Finland", et: "Soome" },
    methods: {
      en: [
        "SmartPosti parcel locker (Itella)",
        "Courier delivery",
        "GLS parcel locker or parcel shop (where offered at checkout)",
      ],
      et: [
        "SmartPosti pakiautomaat (Itella)",
        "Kullertarne",
        "GLS pakiautomaat või pakipood (kui checkoutis saadaval)",
      ],
    },
    deliveryTime: DELIVERY_TIMES.finland,
  },
  {
    id: "other-eu",
    title: { en: "Other EU countries", et: "Muud ELi riigid" },
    methods: {
      en: [
        "GLS parcel locker or parcel shop",
        "AlzaBox parcel locker",
        "Nova Post parcel locker (selected countries)",
        "DPD (where available)",
        "Courier delivery",
      ],
      et: [
        "GLS pakiautomaat või pakipood",
        "AlzaBox pakiautomaat",
        "Nova Post pakiautomaat (valitud riikides)",
        "DPD (kui saadaval)",
        "Kullertarne",
      ],
    },
    deliveryTime: DELIVERY_TIMES.eu,
  },
] as const;

/** Matches Montonio payment-method availability in checkout. */
export const PAYMENT_REGIONS: readonly PaymentRegion[] = [
  {
    id: "estonia",
    title: { en: "Estonia", et: "Eesti" },
    methods: {
      en: [
        "Estonian bank links (Swedbank, SEB, LHV, Coop Pank and others)",
        "Visa/Mastercard",
        "Montonio Buy now, pay later (BNPL)",
        "Hire purchase via Montonio (Inbank)",
        "PayPal",
      ],
      et: [
        "Eesti pangalingid (Swedbank, SEB, LHV, Coop Pank jt)",
        "Visa/Mastercard",
        "Montonio „Osta nüüd, maksa hiljem“ (BNPL)",
        "Järelmaks Montonio kaudu (Inbank)",
        "PayPal",
      ],
    },
  },
  {
    id: "latvia-lithuania",
    title: { en: "Latvia & Lithuania", et: "Läti ja Leedu" },
    methods: {
      en: [
        "Local bank links",
        "Visa/Mastercard",
        "Montonio Buy now, pay later (BNPL)",
        "PayPal",
      ],
      et: [
        "Kohalikud pangalingid",
        "Visa/Mastercard",
        "Montonio „Osta nüüd, maksa hiljem“ (BNPL)",
        "PayPal",
      ],
    },
  },
  {
    id: "finland",
    title: { en: "Finland", et: "Soome" },
    methods: {
      en: [
        "Finnish bank links",
        "Visa/Mastercard",
        "MobilePay",
        "PayPal",
      ],
      et: [
        "Soome pangalingid",
        "Visa/Mastercard",
        "MobilePay",
        "PayPal",
      ],
    },
  },
  {
    id: "poland",
    title: { en: "Poland", et: "Poola" },
    methods: {
      en: ["Polish bank links", "Visa/Mastercard", "BLIK", "PayPal"],
      et: ["Poola pangalingid", "Visa/Mastercard", "BLIK", "PayPal"],
    },
  },
  {
    id: "other-eu",
    title: { en: "Other EU countries", et: "Muud ELi riigid" },
    methods: {
      en: [
        "Local bank links (where Montonio supports your country)",
        "Visa/Mastercard",
        "PayPal",
      ],
      et: [
        "Kohalikud pangalingid (kui Montonio toetab teie riiki)",
        "Visa/Mastercard",
        "PayPal",
      ],
    },
  },
] as const;

export const PARCEL_LOCKERS = {
  en: [
    "SmartPosti parcel locker",
    "Omniva parcel locker",
    "DPD parcel locker",
  ],
  et: [
    "SmartPosti pakiautomaat",
    "Omniva pakiautomaat",
    "DPD pakiautomaat",
  ],
} as const;

export const COURIER_DELIVERY = {
  en: "Courier delivery (Omniva, DPD and other carriers shown at checkout)",
  et: "Kullertarne (Omniva, DPD ja teised checkoutis kuvatud vedajad)",
} as const;

export function showroomPickupLabel(locale: Locale) {
  if (locale === "et") {
    return `Salongist kättesaamine — ${SHOWROOM.addressLine}, ${SHOWROOM.city} (ainult Eesti tellimustele)`;
  }

  return `Showroom pickup — ${SHOWROOM.addressLine}, ${SHOWROOM.city} (Estonian orders only)`;
}

export const INTERNATIONAL_CARRIERS_NOTE = {
  en: "Exact carriers and rates depend on your delivery country and order — always check the options shown at checkout before paying.",
  et: "Täpsed vedajad ja hinnad sõltuvad tarneriigist ja tellimusest — enne maksmist vaata alati checkoutis kuvatud valikuid.",
} as const;

export const PAYMENT_METHODS_CHECKOUT = {
  en: [
    "Bank links (country-specific — see payment section below)",
    "Visa/Mastercard card payments",
    "MobilePay (Finland)",
    "Buy now, pay later — Montonio BNPL (Estonia, Latvia, Lithuania)",
    "Hire purchase via Montonio (Estonia)",
    "BLIK (Poland, where available)",
    "PayPal",
  ],
  et: [
    "Pangalingid (riigiti — vt maksete jaotust allpool)",
    "Visa/Mastercardi kaardimaksed",
    "MobilePay (Soome)",
    "Osta nüüd, maksa hiljem — Montonio BNPL (Eesti, Läti, Leedu)",
    "Järelmaks Montonio kaudu (Eesti)",
    "BLIK (Poola, kui saadaval)",
    "PayPal",
  ],
} as const;

export const PAYMENT_CHECKOUT_NOTE = {
  en: "Available payment methods depend on your billing country and order total. Only options shown at checkout can be used.",
  et: "Saadaolevad makseviisid sõltuvad arveldusriigist ja tellimuse summast. Kasutada saab ainult checkoutis kuvatud valikuid.",
} as const;

export function shippingCostsCheckoutText(locale: Locale) {
  if (locale === "et") {
    return "Kohaletoimetamise kulud arvutatakse kassas vastavalt teie asukohale ja valitud tarneviisile.";
  }

  return "Shipping costs are calculated at checkout based on your location and selected delivery method.";
}

export function shippingRegionIntro(locale: Locale) {
  if (locale === "et") {
    return "Tarneviisid ja -ajad sõltuvad tarneriigist. Allpool on ülevaade riigiti; täpsed valikud ja hinnad kuvatakse checkoutis.";
  }

  return "Delivery methods and times depend on your destination country. Below is a country-by-country overview; exact options and prices are shown at checkout.";
}

export function paymentRegionIntro(locale: Locale) {
  if (locale === "et") {
    return "Makseviisid sõltuvad arveldusriigist ja tellimusest. Allpool on ülevaade riigiti; checkoutis kuvatakse alati ainult teie tellimusele saadaolevad valikud.";
  }

  return "Payment methods depend on your billing country and order. Below is a country-by-country overview; checkout always shows only the options available for your order.";
}
