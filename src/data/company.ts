import { SHOWROOM } from "@/data/showroom";

export const STORE_OPERATOR = {
  legalName: "Motomonopol OÜ",
  registryCode: "17332522",
  trademarkHolder: "MotoMad OÜ",
  streetAddress: SHOWROOM.addressLine,
  city: SHOWROOM.city,
  fullAddress: `${SHOWROOM.addressLine}, ${SHOWROOM.city}`,
} as const;
