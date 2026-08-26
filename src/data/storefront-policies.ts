import type { Locale } from "@/i18n/config";
import { SHOWROOM } from "@/data/showroom";

export const POLICY_EMAILS = {
  shop: SHOWROOM.email,
  returns: SHOWROOM.email,
  warranty: SHOWROOM.email,
  support: SHOWROOM.email,
} as const;

export const POLICY_PHONE = SHOWROOM.phone;

/** Shared "last updated" date for shipping, terms, returns, and support pages. */
export const POLICY_LAST_UPDATED: Record<Locale, string> = {
  en: "26 August 2026",
  et: "26. august 2026",
};

export const MONTONIO_PAYMENTS_URL = {
  en: "https://montonio.com/payments/",
  et: "https://montonio.com/et/maksed/",
} as const;

export const ORDER_PROCESSING_DAYS = { en: "1–2 business days", et: "1–2 tööpäeva" };

/** Matches WooCommerce free-shipping minimum order amount (EUR). */
export const FREE_SHIPPING_THRESHOLD_EUR = 200;

export function freeShippingThresholdLabel(locale: Locale): string {
  if (locale === "et") {
    return `Tasuta tarne alates ${FREE_SHIPPING_THRESHOLD_EUR} €`;
  }

  return `Free shipping from €${FREE_SHIPPING_THRESHOLD_EUR}`;
}

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
        "Visa, Mastercard, Apple Pay, Google Pay (WooPayments / Stripe, when shown at checkout)",
        "Estonian bank links (Swedbank, SEB, LHV, Coop Pank and others — Montonio)",
        "Montonio Buy now, pay later (BNPL)",
        "Hire purchase via Montonio (Inbank)",
        "PayPal (Montonio)",
      ],
      et: [
        "Visa, Mastercard, Apple Pay, Google Pay (WooPayments / Stripe, kui checkoutis kuvatud)",
        "Eesti pangalingid (Swedbank, SEB, LHV, Coop Pank jt — Montonio)",
        "Montonio „Osta nüüd, maksa hiljem“ (BNPL)",
        "Järelmaks Montonio kaudu (Inbank)",
        "PayPal (Montonio)",
      ],
    },
  },
  {
    id: "latvia-lithuania",
    title: { en: "Latvia & Lithuania", et: "Läti ja Leedu" },
    methods: {
      en: [
        "Visa, Mastercard, Apple Pay, Google Pay (WooPayments / Stripe, when shown at checkout)",
        "Local bank links (Montonio)",
        "Montonio Buy now, pay later (BNPL)",
        "PayPal (Montonio)",
      ],
      et: [
        "Visa, Mastercard, Apple Pay, Google Pay (WooPayments / Stripe, kui checkoutis kuvatud)",
        "Kohalikud pangalingid (Montonio)",
        "Montonio „Osta nüüd, maksa hiljem“ (BNPL)",
        "PayPal (Montonio)",
      ],
    },
  },
  {
    id: "finland",
    title: { en: "Finland", et: "Soome" },
    methods: {
      en: [
        "Visa, Mastercard, Apple Pay, Google Pay (WooPayments / Stripe, when shown at checkout)",
        "Finnish bank links (Montonio)",
        "MobilePay (Montonio)",
        "PayPal (Montonio)",
      ],
      et: [
        "Visa, Mastercard, Apple Pay, Google Pay (WooPayments / Stripe, kui checkoutis kuvatud)",
        "Soome pangalingid (Montonio)",
        "MobilePay (Montonio)",
        "PayPal (Montonio)",
      ],
    },
  },
  {
    id: "poland",
    title: { en: "Poland", et: "Poola" },
    methods: {
      en: [
        "Visa, Mastercard, Apple Pay, Google Pay (WooPayments / Stripe, when shown at checkout)",
        "Polish bank links (Montonio)",
        "BLIK (Montonio)",
        "PayPal (Montonio)",
      ],
      et: [
        "Visa, Mastercard, Apple Pay, Google Pay (WooPayments / Stripe, kui checkoutis kuvatud)",
        "Poola pangalingid (Montonio)",
        "BLIK (Montonio)",
        "PayPal (Montonio)",
      ],
    },
  },
  {
    id: "other-eu",
    title: { en: "Other EU countries", et: "Muud ELi riigid" },
    methods: {
      en: [
        "Visa, Mastercard, Apple Pay, Google Pay (WooPayments / Stripe, when shown at checkout)",
        "Local bank links (Montonio, where supported)",
        "PayPal (Montonio)",
      ],
      et: [
        "Visa, Mastercard, Apple Pay, Google Pay (WooPayments / Stripe, kui checkoutis kuvatud)",
        "Kohalikud pangalingid (Montonio, kui toetatud)",
        "PayPal (Montonio)",
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
    "Visa, Mastercard, Apple Pay, Google Pay (WooPayments / Stripe, when shown at checkout)",
    "Bank links (Montonio, country-specific — see payment section below)",
    "MobilePay (Finland, Montonio)",
    "Buy now, pay later — Montonio BNPL (Estonia, Latvia, Lithuania)",
    "Hire purchase via Montonio (Estonia)",
    "BLIK (Poland, Montonio, where available)",
    "PayPal (Montonio)",
  ],
  et: [
    "Visa, Mastercard, Apple Pay, Google Pay (WooPayments / Stripe, kui checkoutis kuvatud)",
    "Pangalingid (Montonio, riigiti — vt maksete jaotust allpool)",
    "MobilePay (Soome, Montonio)",
    "Osta nüüd, maksa hiljem — Montonio BNPL (Eesti, Läti, Leedu)",
    "Järelmaks Montonio kaudu (Eesti)",
    "BLIK (Poola, Montonio, kui saadaval)",
    "PayPal (Montonio)",
  ],
} as const;

export const PAYMENT_CHECKOUT_NOTE = {
  en: "Available payment methods depend on your billing country and order total. Only options shown at checkout can be used.",
  et: "Saadaolevad makseviisid sõltuvad arveldusriigist ja tellimuse summast. Kasutada saab ainult checkoutis kuvatud valikuid.",
} as const;

export function shippingCostsCheckoutText(locale: Locale) {
  if (locale === "et") {
    return `Kohaletoimetamise kulud arvutatakse kassas vastavalt teie asukohale ja valitud tarneviisile. Tellimustele alates ${FREE_SHIPPING_THRESHOLD_EUR} € kehtib tasuta tarne (v.a. erijuhtumid, nt mootorratta transport kokkuleppel).`;
  }

  return `Shipping costs are calculated at checkout based on your location and selected delivery method. Orders from €${FREE_SHIPPING_THRESHOLD_EUR} qualify for free shipping (except special cases such as motorcycle transport by agreement).`;
}

export function shippingRegionIntro(locale: Locale) {
  if (locale === "et") {
    return "Tarneviisid ja -ajad sõltuvad tarneriigist. Allpool on ülevaade riigiti; täpsed valikud ja hinnad kuvatakse checkoutis.";
  }

  return "Delivery methods and times depend on your destination country. Below is a country-by-country overview; exact options and prices are shown at checkout.";
}

export function paymentRegionIntro(locale: Locale) {
  if (locale === "et") {
    return "Makseviisid sõltuvad arveldusriigist ja tellimusest. Kaardid ja Apple Pay / Google Pay töödeldakse WooPayments (Stripe) kaudu; pangalingid, MobilePay, BNPL, järelmaks, BLIK ja PayPal Montonio kaudu — alati ainult checkoutis kuvatud valikud.";
  }

  return "Payment methods depend on your billing country and order. Cards and Apple Pay / Google Pay are processed via WooPayments (Stripe); bank links, MobilePay, BNPL, hire purchase, BLIK and PayPal via Montonio — only options shown at checkout apply.";
}

export function paymentProcessingParagraphs(locale: Locale): readonly string[] {
  if (locale === "et") {
    return [
      "Maksed tehakse väljaspool veebipoodi turvalises keskkonnas. Kaardimaksed ning Apple Pay ja Google Pay (kui checkoutis kuvatud) töötleb WooPayments (Stripe). Pangalingid, MobilePay, BNPL, järelmaks, BLIK ja PayPal (kui saadaval) töötleb Montonio Finance UAB — pangalingi puhul panga turvalises keskkonnas. Müüjal puudub juurdepääs kliendi panga- ega kaardiandmetele.",
      "Leping jõustub alates tasumisele kuuluva summa laekumisest veebipoe pangakontole.",
    ];
  }

  return [
    "Payments are made outside the Web Store in a secure environment. Card payments and Apple Pay / Google Pay (when shown at checkout) are processed by WooPayments (Stripe). Bank links, MobilePay, BNPL, hire purchase, BLIK and PayPal (when available) are processed by Montonio Finance UAB — in the bank's secure environment for bank links. The seller does not have access to the customer's bank or card data.",
    "The agreement becomes effective upon receipt of the payable amount to the Web Store's bank account.",
  ];
}

export function paymentSupportBullets(locale: Locale): readonly string[] {
  if (locale === "et") {
    return [
      "Kaardid ja Apple Pay / Google Pay: WooPayments (Stripe), kui checkoutis kuvatud",
      "Pangalingid, MobilePay, BNPL, järelmaks, BLIK, PayPal: Montonio, kui checkoutis kuvatud",
      "Kui makse ebaõnnestub, proovi uuesti või vali teine checkoutis nähtav makseviis",
      "Pärast pangalingi makset klõpsa panga lehel „Tagasi kaupmehe juurde“",
      "Makseprobleemide puhul lisa ühendust võttes tellimuse number",
    ];
  }

  return [
    "Cards and Apple Pay / Google Pay: WooPayments (Stripe), when shown at checkout",
    "Bank links, MobilePay, BNPL, hire purchase, BLIK, PayPal: Montonio, when shown at checkout",
    "If payment fails, try again or choose another method shown at checkout",
    "After paying via bank link, click \"Return to merchant\" on your bank's page",
    "For payment issues, include your order number when you contact us",
  ];
}

/** Listed under privacy policy → authorized processors / recipients. */
export const PAYMENT_PROCESSORS_PRIVACY: Record<Locale, readonly string[]> = {
  et: [
    "WooPayments (Stripe Technology Europe Ltd) — kaardimaksed, Apple Pay ja Google Pay checkoutis",
    "Montonio Finance UAB — pangalingid, MobilePay, BNPL, järelmaks, BLIK ja PayPal",
  ],
  en: [
    "WooPayments (Stripe Technology Europe Ltd) — card payments, Apple Pay and Google Pay at checkout",
    "Montonio Finance UAB — bank links, MobilePay, BNPL, hire purchase, BLIK and PayPal",
  ],
};

export function paymentDataProcessingParagraph(locale: Locale) {
  if (locale === "et") {
    return "Maksete sooritamiseks ja tagasimaksete tegemiseks edastatakse tellimuse, kliendi ja tehingu andmeid makseteenuse pakkujatele (WooPayments / Stripe ja Montonio Finance UAB) ulatuses, mis on vajalik makse töötlemiseks, pettuste ennetamiseks ja vaidluste lahendamiseks. Müüjal puudub juurdepääs täielikele kaardi- ega pangakontoandmetele.";
  }

  return "To process payments and refunds, order, customer and transaction data are shared with payment service providers (WooPayments / Stripe and Montonio Finance UAB) to the extent necessary for payment processing, fraud prevention and dispute resolution. The seller does not have access to full card or bank account details.";
}
