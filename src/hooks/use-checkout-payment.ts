"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchPaymentGateways,
  type PaymentGateway,
} from "@/lib/graphql/checkout";
import { readWooSessionToken } from "@/lib/graphql/checkout-client";

function resolveCheckoutSessionToken(
  readSession?: () => string | null,
) {
  return readSession?.() ?? readWooSessionToken();
}

export function useCheckoutPayment(
  ready: boolean,
  refreshKey = "",
  readSession?: () => string | null,
) {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const gatewaysRef = useRef(gateways);
  gatewaysRef.current = gateways;

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
      // Keep the current gateway list mounted while refreshing after country/shipping changes.
      setLoading(gatewaysRef.current.length === 0);
      setError(null);

      try {
        const nodes = await fetchPaymentGateways(
          resolveCheckoutSessionToken(readSession),
        );
        if (cancelled) {
          return;
        }

        setGateways(nodes);
        setSelectedId((current) => {
          if (current && nodes.some((gateway) => gateway.id === current)) {
            return current;
          }

          return null;
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
  }, [ready, refreshKey, readSession]);

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
