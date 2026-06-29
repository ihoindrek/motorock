import { NextResponse } from "next/server";
import { fetchPaymentGateways } from "@/lib/graphql/checkout";

export async function GET(request: Request) {
  const session =
    request.headers.get("x-woo-session") ??
    request.headers.get("woocommerce-session")?.replace(/^Session\s+/i, "") ??
    null;

  try {
    const gateways = await fetchPaymentGateways(session);
    return NextResponse.json({ gateways });
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Could not load payment methods";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
