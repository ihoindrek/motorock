export const CONSENT_COOKIE_NAME = "motorock_consent";
export const CONSENT_STORAGE_KEY = "motorock_consent";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_DAYS = 365;

export type ConsentCategory = "preferences" | "statistics" | "marketing";

export type ConsentChoices = {
  readonly preferences: boolean;
  readonly statistics: boolean;
  readonly marketing: boolean;
};

export type StoredConsent = ConsentChoices & {
  readonly version: number;
  readonly updatedAt: string;
};

export const DEFAULT_DENIED_CONSENT: ConsentChoices = {
  preferences: false,
  statistics: false,
  marketing: false,
};

export const ACCEPT_ALL_CONSENT: ConsentChoices = {
  preferences: true,
  statistics: true,
  marketing: true,
};
