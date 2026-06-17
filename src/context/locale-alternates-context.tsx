"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "@/i18n/config";

type LocaleAlternates = Partial<Record<Locale, string>>;

type LocaleAlternatesContextValue = {
  alternates: LocaleAlternates | null;
  setAlternates: (alternates: LocaleAlternates | null) => void;
};

const LocaleAlternatesContext = createContext<LocaleAlternatesContextValue | null>(
  null,
);

export function LocaleAlternatesProvider({ children }: { children: ReactNode }) {
  const [alternates, setAlternates] = useState<LocaleAlternates | null>(null);
  const value = useMemo(
    () => ({ alternates, setAlternates }),
    [alternates],
  );

  return (
    <LocaleAlternatesContext.Provider value={value}>
      {children}
    </LocaleAlternatesContext.Provider>
  );
}

export function useLocaleAlternates() {
  return useContext(LocaleAlternatesContext)?.alternates ?? null;
}

export function useSetLocaleAlternates() {
  const context = useContext(LocaleAlternatesContext);

  if (!context) {
    throw new Error(
      "useSetLocaleAlternates must be used within LocaleAlternatesProvider",
    );
  }

  return context.setAlternates;
}
