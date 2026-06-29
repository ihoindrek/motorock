"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MONTONIO_PAYMENT_METHOD_ID,
  type PaymentGateway,
} from "@/lib/graphql/checkout";
import { readWooSessionToken } from "@/lib/graphql/checkout-client";

async function fetchPaymentGatewaysFromApi(sessionToken: string | null) {
  const headers: Record<string, string> = {};

  if (sessionToken) {
    headers["x-woo-session"] = sessionToken;
  }

  const response = await fetch("/api/checkout/payment-gateways", {
    headers,
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    gateways?: PaymentGateway[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not load payment methods");
  }

  return payload.gateways ?? [];
}

export function useCheckoutPayment(ready: boolean, refreshKey = "") {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) {
      setGateways([]);
      setSelectedId(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const nodes = await fetchPaymentGatewaysFromApi(readWooSessionToken());
        if (cancelled) {
          return;
        }

        setGateways(nodes);
        setSelectedId((current) => {
          if (current && nodes.some((gateway) => gateway.id === current)) {
            return current;
          }

          return (
            nodes.find((gateway) => gateway.id === MONTONIO_PAYMENT_METHOD_ID)
              ?.id ??
            nodes[0]?.id ??
            null
          );
        });
      } catch (cause) {
        if (!cancelled) {
          setGateways([]);
          setSelectedId(null);
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load payment methods",
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
  }, [ready, refreshKey]);

  const selectedGateway = useMemo(
    () => gateways.find((gateway) => gateway.id === selectedId) ?? null,
    [gateways, selectedId],
  );

  return {
    gateways,
    loading,
    error,
    selectedId,
    selectedGateway,
    setSelectedId,
  };
}
