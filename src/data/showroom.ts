export const SHOWROOM = {
  name: "Motorock Showroom",
  addressLine: "Pärnu mnt 328",
  city: "Tallinn, Estonia",
  latitude: 59.3875478,
  longitude: 24.6819526,
  googlePlaceId: "ChIJ_yVaWQWVkkYRkZ8_yMUd-fY",
} as const;

/** Map center shifted west so the marker sits right of the "Find us" overlay. */
export const SHOWROOM_MAP_VIEW = {
  latitude: SHOWROOM.latitude,
  longitude: SHOWROOM.longitude - 0.0022,
  zoom: 17,
} as const;

const destinationQuery = `${SHOWROOM.latitude},${SHOWROOM.longitude}`;

export const SHOWROOM_GOOGLE_MAPS_URL =
  "https://maps.app.goo.gl/asUnG4fTTzsbqfno7";

export const SHOWROOM_WAZE_URL = `https://www.waze.com/ul?ll=${destinationQuery}&navigate=yes`;
