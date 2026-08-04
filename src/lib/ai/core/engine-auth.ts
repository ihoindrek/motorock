import { timingSafeEqual } from "node:crypto";

export function verifyAiApiSecret(provided: string | null, secret: string) {
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

export function createJobId() {
  return `ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
