import { NextResponse } from "next/server";
import { estimateProductShipping } from "@/lib/shop/estimate-product-shipping";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = (searchParams.get("country") ?? "EE").toUpperCase();
  const productId = Number.parseInt(searchParams.get("productId") ?? "", 10);
  const variationRaw = searchParams.get("variationId");
  const variationId = variationRaw
    ? Number.parseInt(variationRaw, 10)
    : undefined;
  const size = searchParams.get("size")?.trim() || undefined;
  const color = searchParams.get("color")?.trim() || undefined;

  if (!/^[A-Z]{2}$/.test(country)) {
    return NextResponse.json({ error: "Invalid country" }, { status: 400 });
  }

  if (!Number.isFinite(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
  }

  if (
    variationId !== undefined &&
    (!Number.isFinite(variationId) || variationId <= 0)
  ) {
    return NextResponse.json({ error: "Invalid variationId" }, { status: 400 });
  }

  try {
    const estimate = await estimateProductShipping({
      country,
      productId,
      variationId,
      size,
      color,
    });

    return NextResponse.json(estimate, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Shipping estimate failed";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
