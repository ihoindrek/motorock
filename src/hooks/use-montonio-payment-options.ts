"use client";

import { useEffect, useState } from "react";
import type { MontonioPaymentOption } from "@/types/montonio-payment";

export function useMontonioPaymentOptions(
  country: string,
  enabled: boolean,
) {
  const [options, setOptions] = useState<MontonioPaymentOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setOptions([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const iso = country.toUpperCase();

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/checkout/montonio-payment-methods?country=${encodeURIComponent(iso)}`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as {
          options?: MontonioPaymentOption[];
          configured?: boolean;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load Montonio banks");
        }

        if (cancelled) {
          return;
        }

        setConfigured(payload.configured ?? true);
        setOptions(payload.options ?? []);
      } catch (cause) {
        if (!cancelled) {
          setOptions([]);
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load Montonio banks",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [country, enabled]);

  return {
    options,
    loading,
    error,
    configured,
  };
}
