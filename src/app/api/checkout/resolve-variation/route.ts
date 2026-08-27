import { NextResponse } from "next/server";
import {
  findStoreVariationId,
  fetchStoreProduct,
} from "@/lib/woocommerce/store-api-product";

export const dynamic = "force-dynamic";

/** Server proxy for Store API variation lookup (browser cannot call Woo Store API). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = Number(searchParams.get("productId"));
  const size = searchParams.get("size") ?? undefined;
  const color = searchParams.get("color") ?? undefined;
  const legLength = searchParams.get("legLength") ?? undefined;

  if (!Number.isFinite(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
  }

  const product = await fetchStoreProduct(productId);
  if (!product || product.type !== "variable") {
    return NextResponse.json({ variationId: null });
  }

  const variationId = findStoreVariationId(product, { size, color, legLength });
  return NextResponse.json({ variationId: variationId ?? null });
}
