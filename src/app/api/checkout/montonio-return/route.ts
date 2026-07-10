import { NextResponse } from "next/server";
import { decodeMontonioPaymentToken } from "@/lib/montonio/decode-payment-token";
import {
  captureStorefrontError,
  logStorefrontEvent,
} from "@/lib/monitoring/observability";
import { getStorefrontUrl, getWooStoreUrl } from "@/lib/storefront/url";
import { fetchOrderThankYouKey } from "@/lib/woocommerce/fetch-order-thank-you-key";

export const dynamic = "force-dynamic";

function cartRedirect(locale: string, error?: string | null) {
  const url = new URL(`/${locale}/cart`, getStorefrontUrl());
  if (error) {
    url.searchParams.set("payment_error", error);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderToken = searchParams.get("order-token");
  const errorMessage = searchParams.get("error-message");
  const gateway = searchParams.get("gateway") ?? "wc_montonio_payments";
  const locale = searchParams.get("locale") === "en" ? "en" : "et";

  if (errorMessage) {
    logStorefrontEvent(
      "checkout.montonio.return_error",
      { locale, gateway, errorMessage },
      "warn",
    );
    return cartRedirect(locale, errorMessage);
  }

  if (!orderToken) {
    logStorefrontEvent(
      "checkout.montonio.missing_token",
      { locale, gateway },
      "warn",
    );
    return cartRedirect(locale);
  }

  const wooCallback = new URL(getWooStoreUrl());
  wooCallback.searchParams.set("wc-api", gateway);
  wooCallback.searchParams.set("order-token", orderToken);

  try {
    const wooResponse = await fetch(wooCallback.toString(), {
      redirect: "manual",
      cache: "no-store",
    });

    const location = wooResponse.headers.get("location");
    if (location) {
      logStorefrontEvent("checkout.montonio.return_redirect", {
        locale,
        gateway,
        status: wooResponse.status,
      });
      return NextResponse.redirect(location);
    }
  } catch (error) {
    await captureStorefrontError(error, {
      source: "checkout.montonio_return.woo_callback",
      gateway,
      locale,
    });
  }

  try {
    const token = decodeMontonioPaymentToken(orderToken);
    const orderId = token.merchantReference;
    if (orderId) {
      const orderKey = await fetchOrderThankYouKey(orderId);
      const thankYou = new URL(
        `/${locale}/order/thank-you`,
        getStorefrontUrl(),
      );
      thankYou.searchParams.set("order", orderId);
      if (orderKey) {
        thankYou.searchParams.set("key", orderKey);
      }
      if (token.paymentStatus) {
        thankYou.searchParams.set("status", token.paymentStatus);
      }
      logStorefrontEvent("checkout.montonio.token_fallback_redirect", {
        locale,
        gateway,
        orderId,
        hasOrderKey: Boolean(orderKey),
        paymentStatus: token.paymentStatus ?? null,
      });
      return NextResponse.redirect(thankYou);
    }
  } catch (error) {
    await captureStorefrontError(error, {
      source: "checkout.montonio_return.token_decode",
      gateway,
      locale,
    });
  }

  return cartRedirect(locale);
}
