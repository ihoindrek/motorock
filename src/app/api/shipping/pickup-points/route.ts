import { NextResponse } from "next/server";
import {
  resolveMontonioPickupPointType,
  resolvePickupPointSources,
} from "@/lib/shipping/pickup-carrier";
import { searchPickupPoints } from "@/lib/shipping/pickup-points/search";
import type { ShippingRate } from "@/lib/shop/shipping-method";

function rateFromParams(searchParams: URLSearchParams): ShippingRate | null {
  const methodId = searchParams.get("methodId");
  const rateId = searchParams.get("rateId");
  const label = searchParams.get("label");

  if (!methodId || !rateId) {
    return null;
  }

  return {
    id: rateId,
    methodId,
    label: label ?? "",
    cost: null,
    instanceId: null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = (searchParams.get("country") ?? "EE").toUpperCase();
  const query = searchParams.get("q") ?? "";
  const rate = rateFromParams(searchParams);

  if (!rate) {
    return NextResponse.json(
      { error: "Missing shipping rate parameters" },
      { status: 400 },
    );
  }

  if (country.length !== 2) {
    return NextResponse.json({ error: "Invalid country" }, { status: 400 });
  }

  const sources = resolvePickupPointSources(rate, country);
  if (!sources || sources.length === 0) {
    return NextResponse.json({ points: [] });
  }

  const pickupType = resolveMontonioPickupPointType(rate);
  const resolvedSources = sources.map((source) => ({
    ...source,
    pickupType: source.pickupType ?? pickupType,
  }));

  try {
    const points = await searchPickupPoints({
      sources: resolvedSources,
      country,
      query,
      limit: 100,
      type: pickupType,
    });

    return NextResponse.json({ points });
  } catch {
    return NextResponse.json(
      { error: "Could not load pickup points" },
      { status: 502 },
    );
  }
}
