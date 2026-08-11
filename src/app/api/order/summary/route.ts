import { NextResponse } from "next/server";
import { getWooStoreUrl } from "@/lib/storefront/url";

export const dynamic = "force-dynamic";

export type OrderSummary = {
  orderNumber: string;
  status: string;
  email: string;
  total: number;
  currency: string;
  paymentMethod: string;
  shippingMethod: string;
  items: Array<{
    name: string;
    quantity: number;
    total: number;
    productId?: number;
    sku?: string;
  }>;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const order = searchParams.get("order");
  const key = searchParams.get("key");

  if (!order || !key) {
    return NextResponse.json({ error: "Missing order parameters" }, { status: 400 });
  }

  const endpoint = new URL("/wp-json/motorock/v1/order-summary", getWooStoreUrl());
  endpoint.searchParams.set("order", order);
  endpoint.searchParams.set("key", key);

  try {
    const response = await fetch(endpoint.toString(), {
      cache: "no-store",
    });
    const payload = (await response.json()) as OrderSummary & {
      code?: string;
      message?: string;
    };

    if (!response.ok) {
      return NextResponse.json(
        { error: payload.message ?? "Order not found" },
        { status: response.status },
      );
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "Could not load order summary" },
      { status: 502 },
    );
  }
}
