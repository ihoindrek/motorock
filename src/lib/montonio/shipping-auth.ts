import { createHmac } from "node:crypto";

function base64UrlJson(value: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function createMontonioShippingJwt(accessKey: string, secretKey: string) {
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlJson({
    accessKey,
    iat: now,
    exp: now + 60 * 60,
  });
  const data = `${header}.${payload}`;
  const signature = createHmac("sha256", secretKey)
    .update(data)
    .digest("base64url");

  return `${data}.${signature}`;
}
