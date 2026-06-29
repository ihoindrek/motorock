import { NextResponse } from "next/server";
import { getMontonioConfig } from "@/lib/montonio/config";
import { fetchMontonioPaymentOptions } from "@/lib/montonio/payment-methods";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = (searchParams.get("country") ?? "EE").toUpperCase();

  if (country.length !== 2) {
    return NextResponse.json({ error: "Invalid country" }, { status: 400 });
  }

  const config = getMontonioConfig();
  if (!config.isConfigured) {
    return NextResponse.json({
      options: [],
      configured: false,
    });
  }

  try {
    const options = await fetchMontonioPaymentOptions(country);
    return NextResponse.json({
      options,
      configured: true,
    });
  } catch (cause) {
    const message =
      cause instanceof Error
        ? cause.message
        : "Could not load Montonio payment methods";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
