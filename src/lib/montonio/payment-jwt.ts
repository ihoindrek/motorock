import { createHmac } from "node:crypto";

function base64UrlJson(value: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

/** Montonio Stargate JWT — same shape as the WooCommerce plugin helper. */
export function createMontonioSignedJwt(
  payload: Record<string, unknown>,
  secretKey: string,
) {
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: typeof payload.exp === "number" ? payload.exp : now + 60 * 10,
  };
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const encodedPayload = base64UrlJson(body);
  const data = `${header}.${encodedPayload}`;
  const signature = createHmac("sha256", secretKey)
    .update(data)
    .digest("base64url");

  return `${data}.${signature}`;
}
