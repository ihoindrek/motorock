import { NextResponse } from "next/server";
import { getWooStoreUrl } from "@/lib/storefront/url";

function readSessionToken(request: Request) {
  return (
    request.headers.get("x-woo-session") ??
    request.headers.get("woocommerce-session")?.replace(/^Session\s+/i, "") ??
    null
  );
}

export async function GET(request: Request) {
  const sessionToken = readSessionToken(request);
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (sessionToken) {
    headers["woocommerce-session"] = `Session ${sessionToken}`;
  }

  const response = await fetch(`${getWooStoreUrl()}/wp-json/motorock/v1/woo-payments/config`, {
    headers,
    cache: "no-store",
  });

  const body = await response.json();

  return NextResponse.json(body, { status: response.status });
}
