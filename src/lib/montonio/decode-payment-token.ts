import { createHmac, timingSafeEqual } from "node:crypto";
import { getMontonioConfig } from "@/lib/montonio/config";

export type MontonioPaymentToken = {
  uuid?: string;
  merchantReference?: string;
  paymentStatus?: string;
  grandTotal?: string | number;
  currency?: string;
};

function decodeBase64UrlJson(segment: string) {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as Record<
    string,
    unknown
  >;
}

export function decodeMontonioPaymentToken(token: string): MontonioPaymentToken {
  const config = getMontonioConfig();
  if (!config.secretKey) {
    throw new Error("Montonio secret key is not configured.");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid Montonio payment token.");
  }

  const [header, payload, signature] = parts;
  const data = `${header}.${payload}`;
  const expected = createHmac("sha256", config.secretKey)
    .update(data)
    .digest("base64url");

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    throw new Error("Invalid Montonio payment token signature.");
  }

  const decoded = decodeBase64UrlJson(payload);

  return {
    uuid: typeof decoded.uuid === "string" ? decoded.uuid : undefined,
    merchantReference:
      typeof decoded.merchantReference === "string"
        ? decoded.merchantReference
        : decoded.merchantReference !== undefined
          ? String(decoded.merchantReference)
          : undefined,
    paymentStatus:
      typeof decoded.paymentStatus === "string"
        ? decoded.paymentStatus
        : undefined,
    grandTotal:
      typeof decoded.grandTotal === "string" ||
      typeof decoded.grandTotal === "number"
        ? decoded.grandTotal
        : undefined,
    currency: typeof decoded.currency === "string" ? decoded.currency : undefined,
  };
}
