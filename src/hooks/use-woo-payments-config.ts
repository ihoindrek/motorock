"use client";

import { useEffect, useState } from "react";
import {
  fetchWooPaymentsConfig,
  isWooPaymentsGateway,
  type WooPaymentsConfig,
} from "@/lib/checkout/woo-payments";
import { readWooSessionToken } from "@/lib/graphql/checkout-client";

export function useWooPaymentsConfig(
  selectedPaymentId: string | null,
  enabled: boolean,
) {
  const [config, setConfig] = useState<WooPaymentsConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !isWooPaymentsGateway(selectedPaymentId)) {
      setConfig(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const next = await fetchWooPaymentsConfig(readWooSessionToken());
        if (!cancelled) {
          setConfig(next);
        }
      } catch (cause) {
        if (!cancelled) {
          setConfig(null);
          setError(
            cause instanceof Error
              ? cause.message
              : "WooPayments configuration is unavailable.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled, selectedPaymentId]);

  return { config, loading, error };
}
