import { NextResponse } from "next/server";
import { getWooStoreUrl } from "@/lib/storefront/url";

export const dynamic = "force-dynamic";

export type RestoredCartLine = {
  slug: string;
  name: string;
  price: number;
  image: string;
  type: "equipment" | "motorcycle";
  quantity: number;
  productId: number;
  variationId?: number;
  size?: string;
  color?: string;
};

export type OrderRestorePayload = {
  orderNumber: string;
  status: string;
  lines: RestoredCartLine[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const order = searchParams.get("order");
  const key = searchParams.get("key");

  if (!order || !key) {
    return NextResponse.json({ error: "Missing order parameters" }, { status: 400 });
  }

  const endpoint = new URL("/wp-json/motorock/v1/order-restore", getWooStoreUrl());
  endpoint.searchParams.set("order", order);
  endpoint.searchParams.set("key", key);

  try {
    const response = await fetch(endpoint.toString(), { cache: "no-store" });
    const payload = (await response.json()) as OrderRestorePayload & {
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
      { error: "Could not restore the order" },
      { status: 502 },
    );
  }
}
