import { NextResponse } from "next/server";
import {
  buildAddToCartVariationAttributes,
  fetchStoreProduct,
} from "@/lib/woocommerce/store-api-product";

export const dynamic = "force-dynamic";

/** Server proxy for Woo variation attribute slugs (browser cannot call Store API). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = Number(searchParams.get("productId"));
  const variationId = Number(searchParams.get("variationId"));

  if (!Number.isFinite(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
  }

  if (!Number.isFinite(variationId) || variationId <= 0) {
    return NextResponse.json({ error: "Invalid variationId" }, { status: 400 });
  }

  const product = await fetchStoreProduct(productId);
  if (!product || product.type !== "variable") {
    return NextResponse.json({ variation: [] });
  }

  const variation = buildAddToCartVariationAttributes(product, {}, variationId);
  return NextResponse.json({ variation });
}
