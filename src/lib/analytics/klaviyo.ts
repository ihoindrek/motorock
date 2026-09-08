import { getGtmId, isConsentEnabled } from "@/lib/consent/config";
import { readStoredConsent } from "@/lib/consent/storage";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

declare global {
  interface Window {
    _learnq?: unknown[][];
  }
}

export function canSendKlaviyoEvents() {
  if (!getGtmId()) {
    return false;
  }

  if (!isConsentEnabled()) {
    return true;
  }

  return readStoredConsent()?.marketing === true;
}

function ensureLearnq() {
  if (typeof window === "undefined") {
    return false;
  }

  window._learnq = window._learnq ?? [];
  return true;
}

export function normalizeKlaviyoEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isKlaviyoIdentifiableEmail(email: string) {
  const normalized = normalizeKlaviyoEmail(email);
  return normalized.length > 0 && EMAIL_PATTERN.test(normalized);
}

/** Links anonymous onsite activity to a profile once checkout email is known. */
export function identifyKlaviyoProfile(email: string) {
  if (!canSendKlaviyoEvents() || !ensureLearnq()) {
    return;
  }

  const normalized = normalizeKlaviyoEmail(email);
  if (!EMAIL_PATTERN.test(normalized)) {
    return;
  }

  window._learnq!.push(["identify", { $email: normalized, email: normalized }]);
}
