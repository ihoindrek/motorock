export function getGtmId() {
  return process.env.NEXT_PUBLIC_GTM_ID?.trim() || null;
}

export function isConsentEnabled() {
  return process.env.NEXT_PUBLIC_CONSENT_ENABLED !== "false";
}

export function isTrackingConfigured() {
  return Boolean(getGtmId());
}
