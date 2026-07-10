"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { CookieConsent, type CookieCategory, type CookieConsentCopy } from "@/components/ui/cookie-consent";
import { useConsent } from "@/context/consent-context";
import { useDictionary, useLocale } from "@/context/locale-context";
import { localizedHref, stripLocaleFromPath } from "@/i18n/paths";
import { isConsentEnabled } from "@/lib/consent/config";
import type { ConsentChoices } from "@/lib/consent/types";

function choicesToPreferences(choices: ConsentChoices) {
  return [true, choices.preferences, choices.statistics, choices.marketing];
}

function preferencesToChoices(preferences: boolean[]): ConsentChoices {
  return {
    preferences: preferences[1] ?? false,
    statistics: preferences[2] ?? false,
    marketing: preferences[3] ?? false,
  };
}

export function CookieConsentUi() {
  const pathname = usePathname();
  const locale = useLocale();
  const dictionary = useDictionary();
  const consentCopy = dictionary.consent;
  const isCheckoutPage = stripLocaleFromPath(pathname) === "/cart";
  const {
    enabled,
    hasAnswered,
    choices,
    bannerOpen,
    preferencesOpen,
    acceptAll,
    rejectAll,
    saveChoices,
    openPreferences,
    closePreferences,
  } = useConsent();

  const [draftPreferences, setDraftPreferences] = useState<boolean[]>(() =>
    choicesToPreferences(choices),
  );

  useEffect(() => {
    if (preferencesOpen) {
      setDraftPreferences(choicesToPreferences(choices));
    }
  }, [choices, preferencesOpen]);

  const categories = useMemo<readonly CookieCategory[]>(
    () => [
      {
        id: "essential",
        name: consentCopy.functionalLabel,
        description: consentCopy.functionalDescription,
        isEssential: true,
      },
      {
        id: "preferences",
        name: consentCopy.preferencesLabel,
        description: consentCopy.preferencesDescription,
      },
      {
        id: "analytics",
        name: consentCopy.statisticsLabel,
        description: consentCopy.statisticsDescription,
      },
      {
        id: "marketing",
        name: consentCopy.marketingLabel,
        description: consentCopy.marketingDescription,
      },
    ],
    [consentCopy],
  );

  const copy = useMemo<CookieConsentCopy>(
    () => ({
      bannerTitle: consentCopy.bannerTitle,
      bannerDescription: consentCopy.bannerDescription,
      acceptAll: consentCopy.acceptAll,
      customize: consentCopy.customize,
      rejectAll: consentCopy.rejectAll,
      savePreferences: consentCopy.savePreferences,
      preferencesTitle: consentCopy.preferencesTitle,
      manageDescription: consentCopy.manageDescription,
      policyLink: consentCopy.policyLink,
      requiredBadge: consentCopy.functionalAlwaysActive,
      requiredHint: consentCopy.requiredHint,
      reopenLabel: consentCopy.cookieSettings,
    }),
    [consentCopy],
  );

  if (!enabled || !isConsentEnabled()) {
    return null;
  }

  return (
    <CookieConsent
      categories={[...categories]}
      cookiePolicyUrl={localizedHref(locale, "/cookies")}
      copy={copy}
      isBannerVisible={bannerOpen}
      isCustomizeOpen={preferencesOpen}
      isReopenVisible={
        hasAnswered && !bannerOpen && !preferencesOpen && !isCheckoutPage
      }
      preferences={draftPreferences}
      onPreferencesChange={setDraftPreferences}
      onCustomizeOpenChange={(open) => {
        if (open) {
          openPreferences();
          return;
        }
        closePreferences();
      }}
      onAcceptAll={acceptAll}
      onRejectAll={rejectAll}
      onSave={() => saveChoices(preferencesToChoices(draftPreferences))}
    />
  );
}
