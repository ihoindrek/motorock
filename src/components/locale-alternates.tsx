"use client";

import { useEffect } from "react";
import type { Locale } from "@/i18n/config";
import { useSetLocaleAlternates } from "@/context/locale-alternates-context";

type ProductLocaleAlternatesProps = {
  alternates: Partial<Record<Locale, string>>;
};

export function ProductLocaleAlternates({
  alternates,
}: ProductLocaleAlternatesProps) {
  const setAlternates = useSetLocaleAlternates();

  useEffect(() => {
    setAlternates(alternates);

    return () => {
      setAlternates(null);
    };
  }, [alternates, setAlternates]);

  return null;
}
