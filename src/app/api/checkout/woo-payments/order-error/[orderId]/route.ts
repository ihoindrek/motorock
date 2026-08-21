import { NextResponse } from "next/server";
import { readJsonResponse } from "@/lib/http/read-json-response";
import { getWooStoreUrl } from "@/lib/storefront/url";

function readSessionToken(request: Request) {
  return (
    request.headers.get("x-woo-session") ??
    request.headers.get("woocommerce-session")?.replace(/^Session\s+/i, "") ??
    null
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await context.params;
  const sessionToken = readSessionToken(request);
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (sessionToken) {
    headers["woocommerce-session"] = `Session ${sessionToken}`;
  }

  const response = await fetch(
    `${getWooStoreUrl()}/wp-json/motorock/v1/woo-payments/order-error/${orderId}`,
    {
      headers,
      cache: "no-store",
    },
  );

  const body = (await readJsonResponse<{ message?: string | null }>(response)) ?? {
    message: "",
  };

  return NextResponse.json(body, { status: response.status });
}
