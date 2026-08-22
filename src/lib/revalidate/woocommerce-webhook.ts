export type WooWebhookPayload = {
  id?: number;
  slug?: string;
};

export function parseWooWebhookPayload(raw: string): WooWebhookPayload | null {
  const trimmed = raw.trim();

  if (!trimmed || trimmed.startsWith("webhook_id=")) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as WooWebhookPayload;
  } catch {
    return null;
  }
}

export function extractProductSlug(payload: WooWebhookPayload): string | null {
  if (typeof payload.slug !== "string") {
    return null;
  }

  const slug = payload.slug.trim();
  return slug || null;
}

export function isProductWebhookTopic(topic: string) {
  return topic.startsWith("product.");
}
