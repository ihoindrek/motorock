import type { ConsentChoices } from "@/lib/consent/types";

export type GoogleConsentState = {
  ad_storage: "granted" | "denied";
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
  analytics_storage: "granted" | "denied";
  functionality_storage: "granted" | "denied";
  personalization_storage: "granted" | "denied";
  security_storage: "granted" | "denied";
};

const CONSENT_DEFAULT: GoogleConsentState = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  functionality_storage: "denied",
  personalization_storage: "denied",
  security_storage: "granted",
};

export function choicesToGoogleConsent(choices: ConsentChoices): GoogleConsentState {
  return {
    security_storage: "granted",
    functionality_storage: choices.preferences ? "granted" : "denied",
    personalization_storage: choices.preferences ? "granted" : "denied",
    analytics_storage: choices.statistics ? "granted" : "denied",
    ad_storage: choices.marketing ? "granted" : "denied",
    ad_user_data: choices.marketing ? "granted" : "denied",
    ad_personalization: choices.marketing ? "granted" : "denied",
  };
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function ensureGtag() {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer ?? [];

  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  }
}

export function applyGoogleConsentUpdate(choices: ConsentChoices) {
  if (typeof window === "undefined") {
    return;
  }

  ensureGtag();
  window.gtag?.("consent", "update", choicesToGoogleConsent(choices));

  window.dataLayer?.push({
    event: "consent_update",
    consent_preferences: choices.preferences,
    consent_statistics: choices.statistics,
    consent_marketing: choices.marketing,
  });
}

export function buildConsentBootstrapScript() {
  const defaultState = JSON.stringify(CONSENT_DEFAULT);

  return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', Object.assign(${defaultState}, { wait_for_update: 500 }));
(function () {
  var match = document.cookie.match(/(?:^|; )motorock_consent=([^;]*)/);
  if (!match) return;
  try {
    var stored = JSON.parse(decodeURIComponent(match[1]));
    if (!stored || typeof stored !== 'object') return;
    gtag('consent', 'update', {
      functionality_storage: stored.preferences ? 'granted' : 'denied',
      personalization_storage: stored.preferences ? 'granted' : 'denied',
      analytics_storage: stored.statistics ? 'granted' : 'denied',
      ad_storage: stored.marketing ? 'granted' : 'denied',
      ad_user_data: stored.marketing ? 'granted' : 'denied',
      ad_personalization: stored.marketing ? 'granted' : 'denied',
      security_storage: 'granted'
    });
  } catch (error) {}
})();
`.trim();
}
