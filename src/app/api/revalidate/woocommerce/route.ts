import { createHmac, timingSafeEqual } from "node:crypto";
import {
  logStorefrontEvent,
} from "@/lib/monitoring/observability";
import {
  revalidateFromManualRequest,
  revalidateFromWooWebhook,
} from "@/lib/revalidate/handle-woocommerce-revalidate";

export const dynamic = "force-dynamic";

function verifyWooSignature(payload: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(payload).digest("base64");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

function verifyManualSecret(provided: string | null, secret: string) {
  if (!provided) {
    return false;
  }

  const expectedBuffer = Buffer.from(secret);
  const actualBuffer = Buffer.from(provided);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

function revalidateResponse(
  source: string,
  meta: Record<string, unknown> = {},
) {
  const result = revalidateFromManualRequest();
  logStorefrontEvent("storefront.revalidate", { source, ...result, ...meta });

  return Response.json({
    ok: true,
    revalidated: true,
    source,
    ...result,
    timestamp: new Date().toISOString(),
  });
}

/** Manual cache purge — Authorization: Bearer <REVALIDATE_SECRET|WOOCOMMERCE_WEBHOOK_SECRET> */
export async function GET(request: Request) {
  const secret =
    process.env.REVALIDATE_SECRET ?? process.env.WOOCOMMERCE_WEBHOOK_SECRET;

  if (!secret) {
    return Response.json(
      { ok: false, error: "Missing REVALIDATE_SECRET or WOOCOMMERCE_WEBHOOK_SECRET" },
      { status: 500 },
    );
  }

  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
  const querySecret = new URL(request.url).searchParams.get("secret");

  if (
    !verifyManualSecret(bearer, secret) &&
    !verifyManualSecret(querySecret, secret)
  ) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return revalidateResponse("manual");
}

function isWooWebhookPing(payload: string, signature: string | null) {
  return !signature && /^webhook_id=\d+$/.test(payload.trim());
}

export async function POST(request: Request) {
  const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;
  const signature = request.headers.get("x-wc-webhook-signature");
  const topic = request.headers.get("x-wc-webhook-topic") ?? "unknown";
  const deliveryId = request.headers.get("x-wc-webhook-delivery-id") ?? "unknown";
  const payload = await request.text();

  if (!webhookSecret) {
    return Response.json(
      { ok: false, error: "Missing WOOCOMMERCE_WEBHOOK_SECRET" },
      { status: 500 },
    );
  }

  // WooCommerce deliver_ping on webhook save — no signature, body: webhook_id=123
  if (isWooWebhookPing(payload, signature)) {
    logStorefrontEvent("storefront.webhook.ping", {
      topic,
      deliveryId,
      webhookId: payload.trim(),
    });

    return Response.json({
      ok: true,
      revalidated: false,
      source: "woocommerce-webhook-ping",
      topic,
      deliveryId,
      timestamp: new Date().toISOString(),
    });
  }

  if (!signature || !verifyWooSignature(payload, signature, webhookSecret)) {
    logStorefrontEvent(
      "storefront.webhook.rejected",
      { topic, deliveryId, reason: "invalid_signature" },
      "warn",
    );
    return Response.json({ ok: false, error: "Invalid webhook signature" }, { status: 401 });
  }

  const result = revalidateFromWooWebhook(topic, payload);
  logStorefrontEvent("storefront.revalidate", {
    source: "woocommerce-webhook",
    topic,
    deliveryId,
    ...result,
  });

  return Response.json({
    ok: true,
    revalidated: true,
    source: "woocommerce-webhook",
    topic,
    deliveryId,
    ...result,
    timestamp: new Date().toISOString(),
  });
}
