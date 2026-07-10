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
  finland: { en: "Finland: 3–5 working days", et: "Soome: 3–5 tööpäeva" },
  eu: {
    en: "Other EU countries: 10–14 calendar days",
    et: "Muud ELi riigid: 10–14 kalendripäeva",
  },
} as const;

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
  en: "Across the EU, checkout may also offer international parcel lockers and couriers such as GLS, AlzaBox and Nova Post depending on your delivery country.",
  et: "Üle EL-i võib checkoutis sõltuvalt tarneriigist pakkuda ka rahvusvahelisi pakiautomaate ja kullereid (nt GLS, AlzaBox, Nova Post).",
} as const;

export const PAYMENT_METHODS_CHECKOUT = {
  en: [
    "Bank links for Estonia, Latvia, Lithuania, Finland and other countries shown at checkout",
    "Visa/Mastercard card payments",
    "Buy now, pay later (Montonio BNPL, where available)",
    "Hire purchase / instalments (Montonio, Estonia)",
  ],
  et: [
    "Pangalingid Eestis, Lätis, Leedus, Soomes ja teistes checkoutis kuvatud riikides",
    "Visa/Mastercardi kaardimaksed",
    "Osta nüüd, maksa hiljem (Montonio BNPL, kui saadaval)",
    "Järelmaks (Montonio, Eesti)",
  ],
} as const;

export function shippingCostsCheckoutText(locale: Locale) {
  if (locale === "et") {
    return "Kohaletoimetamise kulud arvutatakse kassas vastavalt teie asukohale ja valitud tarneviisile.";
  }

  return "Shipping costs are calculated at checkout based on your location and selected delivery method.";
}
