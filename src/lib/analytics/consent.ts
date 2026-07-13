import { getGtmId, isConsentEnabled } from "@/lib/consent/config";
import { readStoredConsent } from "@/lib/consent/storage";

export function isAnalyticsConfigured() {
  return Boolean(getGtmId());
}

export function canSendAnalyticsEvents() {
  if (!isAnalyticsConfigured()) {
    return false;
  }

  if (!isConsentEnabled()) {
    return true;
  }

  return readStoredConsent()?.statistics === true;
}
