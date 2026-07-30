"use client";

import { useEffect, useState } from "react";

let cachedCountry: string | null = null;
let fetchPromise: Promise<string | null> | null = null;

async function loadVisitorCountry() {
  if (cachedCountry) {
    return cachedCountry;
  }

  if (!fetchPromise) {
    fetchPromise = fetch("/api/geo", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const payload = (await response.json()) as { country?: string };
        const country = payload.country?.trim().toUpperCase();

        if (country && /^[A-Z]{2}$/.test(country)) {
          cachedCountry = country;
          return country;
        }

        return null;
      })
      .catch(() => null)
      .finally(() => {
        fetchPromise = null;
      });
  }

  return fetchPromise;
}

export function useVisitorCountry() {
  const [country, setCountry] = useState<string | null>(cachedCountry);
  const [loading, setLoading] = useState(!cachedCountry);

  useEffect(() => {
    if (cachedCountry) {
      setCountry(cachedCountry);
      setLoading(false);
      return;
    }

    let cancelled = false;

    void loadVisitorCountry().then((resolved) => {
      if (cancelled) {
        return;
      }

      setCountry(resolved);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { country, loading };
}
