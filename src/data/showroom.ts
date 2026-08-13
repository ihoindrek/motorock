import type { Locale } from "@/i18n/config";

const SHOWROOM_COPY: Record<
  Locale,
  {
    name: string;
    hours: {
      weekdays: string;
      saturday: string;
      sunday: string;
    };
    phoneNote: string;
  }
> = {
  en: {
    name: "Tallinn shop",
    hours: {
      weekdays: "Mon–Fri 10–18",
      saturday: "Sat 11–16",
      sunday: "Sun closed",
    },
    phoneNote: "At other times, call ahead and we'll make an appointment",
  },
  et: {
    name: "Motorock salong",
    hours: {
      weekdays: "E–R 10–18",
      saturday: "L 11–16",
      sunday: "P suletud",
    },
    phoneNote: "Teistel aegadel helista ette — lepime kokku aja.",
  },
};

export const SHOWROOM = {
  addressLine: "Pärnu mnt 328",
  city: "Tallinn",
  phone: "+372 56 500 400",
  phoneHref: "tel:+37256500400",
  email: "info@motorock.eu",
  emailHref: "mailto:info@motorock.eu",
  latitude: 59.3875478,
  longitude: 24.6819526,
  googlePlaceId: "ChIJRfKuvwyVkkYREebHG2948io",
  name: SHOWROOM_COPY.en.name,
  hours: SHOWROOM_COPY.en.hours,
  phoneNote: SHOWROOM_COPY.en.phoneNote,
} as const;

export function getShowroomCopy(locale: Locale) {
  return SHOWROOM_COPY[locale];
}

/** Map center shifted west so the marker sits right of the "Find us" overlay. */
export const SHOWROOM_MAP_VIEW = {
  latitude: SHOWROOM.latitude,
  longitude: SHOWROOM.longitude - 0.0022,
  zoom: 17,
} as const;

/** Mobile: center shifted north so the pin sits in the visible map area. */
export const SHOWROOM_MAP_VIEW_MOBILE = {
  latitude: SHOWROOM.latitude + 0.0011,
  longitude: SHOWROOM.longitude,
  zoom: 17,
} as const;

const destinationQuery = `${SHOWROOM.latitude},${SHOWROOM.longitude}`;

export const SHOWROOM_GOOGLE_MAPS_URL =
  "https://maps.app.goo.gl/asUnG4fTTzsbqfno7";

export const SHOWROOM_GOOGLE_WRITE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${SHOWROOM.googlePlaceId}`;

export const SHOWROOM_WAZE_URL = `https://www.waze.com/ul?ll=${destinationQuery}&navigate=yes`;
