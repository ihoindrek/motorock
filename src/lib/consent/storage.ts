import {
  CONSENT_COOKIE_NAME,
  CONSENT_MAX_AGE_DAYS,
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  type ConsentChoices,
  type StoredConsent,
} from "@/lib/consent/types";

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function parseStoredConsent(value: string | null | undefined): StoredConsent | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<StoredConsent>;

    if (
      typeof parsed.preferences !== "boolean" ||
      typeof parsed.statistics !== "boolean" ||
      typeof parsed.marketing !== "boolean"
    ) {
      return null;
    }

    if (parsed.version !== CONSENT_VERSION) {
      return null;
    }

    return {
      version: CONSENT_VERSION,
      preferences: parsed.preferences,
      statistics: parsed.statistics,
      marketing: parsed.marketing,
      updatedAt:
        typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function readCookieValue(): string | null {
  if (!isBrowser()) {
    return null;
  }

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CONSENT_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
  );

  return match ? decodeURIComponent(match[1]) : null;
}

export function readStoredConsent(): StoredConsent | null {
  if (!isBrowser()) {
    return null;
  }

  const fromCookie = parseStoredConsent(readCookieValue());
  if (fromCookie) {
    return fromCookie;
  }

  return parseStoredConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY));
}

export function persistConsent(choices: ConsentChoices): StoredConsent {
  const stored: StoredConsent = {
    version: CONSENT_VERSION,
    preferences: choices.preferences,
    statistics: choices.statistics,
    marketing: choices.marketing,
    updatedAt: new Date().toISOString(),
  };

  if (!isBrowser()) {
    return stored;
  }

  const serialized = JSON.stringify(stored);
  const maxAgeSeconds = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;

  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(serialized)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
  window.localStorage.setItem(CONSENT_STORAGE_KEY, serialized);

  return stored;
}

export function clearStoredConsent() {
  if (!isBrowser()) {
    return;
  }

  document.cookie = `${CONSENT_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  window.localStorage.removeItem(CONSENT_STORAGE_KEY);
}
