import { decodeMontonioPaymentToken } from "@/lib/montonio/decode-payment-token";
import {
  captureStorefrontError,
  logStorefrontEvent,
} from "@/lib/monitoring/observability";
import { getStorefrontUrl, getWooStoreUrl } from "@/lib/storefront/url";
import { fetchOrderReturnContext } from "@/lib/woocommerce/fetch-order-return-context";

export type MontonioReturnInput = {
  orderToken?: string | null;
  errorMessage?: string | null;
  gateway?: string | null;
  locale?: string | null;
};

const MONTONIO_GATEWAY_FALLBACKS = [
  "wc_montonio_payments",
  "wc_montonio_card",
  "wc_montonio_mobilepay",
  "wc_montonio_blik",
  "wc_montonio_bnpl",
  "wc_montonio_hire_purchase",
] as const;

function resolveLocale(value: string | null | undefined) {
  return value === "en" ? "en" : "et";
}

function isSuccessfulMontonioPaymentStatus(status?: string | null) {
  if (!status) {
    return false;
  }

  const normalized = status.trim().toUpperCase();
  return normalized === "PAID" || normalized === "FINALIZED";
}

function normalizeStorefrontRedirect(location: string, locale: "en" | "et") {
  const storefrontOrigin = new URL(getStorefrontUrl()).origin;

  let url: URL;
  try {
    url = new URL(location, getStorefrontUrl());
  } catch {
    return location;
  }

  if (url.origin !== storefrontOrigin) {
    return location;
  }

  const path = url.pathname.replace(/\/$/, "") || "/";

  if (path === "/checkout" || path.startsWith("/checkout/")) {
    const error = url.searchParams.get("payment_error") ?? "Payment cancelled";
    return cartRedirectUrl(locale, error);
  }

  if (path === "/cart") {
    const error = url.searchParams.get("payment_error");
    return cartRedirectUrl(locale, error);
  }

  if (
    (path.startsWith("/order/") ||
      path.startsWith("/shop/") ||
      path.startsWith("/product/")) &&
    !path.startsWith("/en/") &&
    !path.startsWith("/et/")
  ) {
    url.pathname = `/${locale}${path}`;
    return url.toString();
  }

  return url.toString();
}

function cartRedirectUrl(locale: "en" | "et", error?: string | null) {
  const url = new URL(`/${locale}/cart`, getStorefrontUrl());
  if (error) {
    url.searchParams.set("payment_error", error);
  }
  return url.toString();
}

function thankYouRedirectUrl(input: {
  locale: "en" | "et";
  orderId: string;
  orderKey?: string | null;
  paymentStatus?: string | null;
}) {
  const url = new URL(`/${input.locale}/order/thank-you`, getStorefrontUrl());
  url.searchParams.set("order", input.orderId);
  if (input.orderKey) {
    url.searchParams.set("key", input.orderKey);
  }
  if (input.paymentStatus) {
    url.searchParams.set("status", input.paymentStatus);
  }
  return url.toString();
}

function normalizeRedirectLocation(location: string, locale: "en" | "et") {
  try {
    const absolute = new URL(location, getWooStoreUrl()).toString();
    return normalizeStorefrontRedirect(absolute, locale);
  } catch {
    return null;
  }
}

async function tryWooMontonioCallback(
  gateway: string,
  orderToken: string,
  locale: "en" | "et",
) {
  const wooCallback = new URL(getWooStoreUrl());
  wooCallback.searchParams.set("wc-api", gateway);
  wooCallback.searchParams.set("order-token", orderToken);

  const response = await fetch(wooCallback.toString(), {
    redirect: "manual",
    cache: "no-store",
  });

  const location = response.headers.get("location");
  if (location) {
    return normalizeRedirectLocation(location, locale);
  }

  return null;
}

function gatewayCandidates(
  preferredGateway: string | null | undefined,
  paymentMethod?: string | null,
) {
  const candidates = new Set<string>();

  if (preferredGateway) {
    candidates.add(preferredGateway);
  }

  if (paymentMethod) {
    candidates.add(paymentMethod);
  }

  for (const gateway of MONTONIO_GATEWAY_FALLBACKS) {
    candidates.add(gateway);
  }

  return [...candidates];
}

export async function resolveMontonioReturnTarget(input: MontonioReturnInput) {
  const locale = resolveLocale(input.locale);

  if (input.errorMessage) {
    logStorefrontEvent(
      "checkout.montonio.return_error",
      { locale, gateway: input.gateway ?? null, errorMessage: input.errorMessage },
      "warn",
    );
    return cartRedirectUrl(locale, input.errorMessage);
  }

  let decodedToken: ReturnType<typeof decodeMontonioPaymentToken> | null = null;

  if (input.orderToken) {
    try {
      decodedToken = decodeMontonioPaymentToken(input.orderToken);
    } catch {
      // Woo callback may still succeed even when local token decode fails.
    }
  }

  if (
    decodedToken?.paymentStatus &&
    !isSuccessfulMontonioPaymentStatus(decodedToken.paymentStatus)
  ) {
    logStorefrontEvent(
      "checkout.montonio.return_incomplete",
      {
        locale,
        gateway: input.gateway ?? null,
        paymentStatus: decodedToken.paymentStatus,
      },
      "warn",
    );
    return cartRedirectUrl(locale, "Payment cancelled");
  }

  if (!input.orderToken) {
    logStorefrontEvent(
      "checkout.montonio.missing_token",
      { locale, gateway: input.gateway ?? null },
      "warn",
    );
    return cartRedirectUrl(locale);
  }

  let orderContext: Awaited<ReturnType<typeof fetchOrderReturnContext>> = null;

  try {
    if (decodedToken?.merchantReference) {
      orderContext = await fetchOrderReturnContext(decodedToken.merchantReference);
    } else {
      const token = decodeMontonioPaymentToken(input.orderToken);
      if (token.merchantReference) {
        orderContext = await fetchOrderReturnContext(token.merchantReference);
      }
    }
  } catch {
    // Woo callback may still succeed even when local token decode fails.
  }

  for (const gateway of gatewayCandidates(
    input.gateway,
    orderContext?.paymentMethod,
  )) {
    try {
      const wooTarget = await tryWooMontonioCallback(
        gateway,
        input.orderToken,
        locale,
      );
      if (wooTarget) {
        logStorefrontEvent("checkout.montonio.return_redirect", {
          locale,
          gateway,
          target: wooTarget,
        });
        return wooTarget;
      }
    } catch (error) {
      await captureStorefrontError(error, {
        source: "checkout.montonio_return.woo_callback",
        gateway,
        locale,
      });
    }
  }

  try {
    const token = decodedToken ?? decodeMontonioPaymentToken(input.orderToken);
    const orderId = token.merchantReference;

    if (orderId) {
      const resolvedLocale =
        orderContext?.locale === "en" || orderContext?.locale === "et"
          ? orderContext.locale
          : locale;
      const target = thankYouRedirectUrl({
        locale: resolvedLocale,
        orderId,
        orderKey: orderContext?.key,
        paymentStatus: token.paymentStatus ?? null,
      });

      logStorefrontEvent("checkout.montonio.token_fallback_redirect", {
        locale: resolvedLocale,
        gateway: input.gateway ?? null,
        orderId,
        hasOrderKey: Boolean(orderContext?.key),
        paymentStatus: token.paymentStatus ?? null,
      });

      return target;
    }
  } catch (error) {
    await captureStorefrontError(error, {
      source: "checkout.montonio_return.token_decode",
      gateway: input.gateway ?? null,
      locale,
    });
  }

  return cartRedirectUrl(locale);
}
