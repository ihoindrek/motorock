"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { applyGoogleConsentUpdate } from "@/lib/consent/consent-mode";
import { isConsentEnabled } from "@/lib/consent/config";
import { persistConsent, readStoredConsent } from "@/lib/consent/storage";
import {
  ACCEPT_ALL_CONSENT,
  DEFAULT_DENIED_CONSENT,
  type ConsentChoices,
} from "@/lib/consent/types";

type ConsentContextValue = {
  enabled: boolean;
  hasAnswered: boolean;
  choices: ConsentChoices;
  bannerOpen: boolean;
  preferencesOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  saveChoices: (choices: ConsentChoices) => void;
  openPreferences: () => void;
  closePreferences: () => void;
  closeBanner: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function commitConsent(choices: ConsentChoices) {
  persistConsent(choices);
  applyGoogleConsentUpdate(choices);
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const enabled = isConsentEnabled();
  const [hasAnswered, setHasAnswered] = useState(false);
  const [choices, setChoices] = useState<ConsentChoices>(DEFAULT_DENIED_CONSENT);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredConsent();

    if (stored) {
      const nextChoices: ConsentChoices = {
        preferences: stored.preferences,
        statistics: stored.statistics,
        marketing: stored.marketing,
      };
      setChoices(nextChoices);
      setHasAnswered(true);
      applyGoogleConsentUpdate(nextChoices);
    } else if (enabled) {
      setBannerOpen(true);
    }

    setHydrated(true);
  }, [enabled]);

  const saveChoices = useCallback((nextChoices: ConsentChoices) => {
    setChoices(nextChoices);
    setHasAnswered(true);
    setBannerOpen(false);
    setPreferencesOpen(false);
    commitConsent(nextChoices);
  }, []);

  const acceptAll = useCallback(() => {
    saveChoices(ACCEPT_ALL_CONSENT);
  }, [saveChoices]);

  const rejectAll = useCallback(() => {
    saveChoices(DEFAULT_DENIED_CONSENT);
  }, [saveChoices]);

  const openPreferences = useCallback(() => {
    setPreferencesOpen(true);
    setBannerOpen(false);
  }, []);

  const closePreferences = useCallback(() => {
    setPreferencesOpen(false);
    if (!hasAnswered) {
      setBannerOpen(true);
    }
  }, [hasAnswered]);

  const closeBanner = useCallback(() => {
    setBannerOpen(false);
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      enabled,
      hasAnswered,
      choices,
      bannerOpen: enabled && hydrated && bannerOpen,
      preferencesOpen: enabled && preferencesOpen,
      acceptAll,
      rejectAll,
      saveChoices,
      openPreferences,
      closePreferences,
      closeBanner,
    }),
    [
      enabled,
      hasAnswered,
      choices,
      hydrated,
      bannerOpen,
      preferencesOpen,
      acceptAll,
      rejectAll,
      saveChoices,
      openPreferences,
      closePreferences,
      closeBanner,
    ],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const context = useContext(ConsentContext);

  if (!context) {
    throw new Error("useConsent must be used within ConsentProvider");
  }

  return context;
}
