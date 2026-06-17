"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { localeCookieName, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

type LocaleContextValue = {
  locale: Locale;
  dictionary: Dictionary;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.cookie = `${localeCookieName}=${locale};path=/;max-age=31536000;samesite=lax`;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, dictionary }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context.locale;
}

export function useDictionary() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useDictionary must be used within LocaleProvider");
  }

  return context.dictionary;
}
