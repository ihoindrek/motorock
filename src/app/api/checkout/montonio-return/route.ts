import { NextResponse } from "next/server";
import { resolveMontonioReturnTarget } from "@/lib/checkout/montonio-return";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const target = await resolveMontonioReturnTarget({
    orderToken: searchParams.get("order-token"),
    errorMessage: searchParams.get("error-message"),
    gateway: searchParams.get("gateway"),
    locale: searchParams.get("locale"),
  });

  return NextResponse.redirect(target);
}
