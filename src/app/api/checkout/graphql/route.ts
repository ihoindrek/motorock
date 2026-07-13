import { getWooGraphqlUrl } from "@/lib/storefront/url";

export const dynamic = "force-dynamic";

/** Same-origin proxy for WooGraphQL checkout (cart, shipping, payment). */
export async function POST(request: Request) {
  const body = await request.text();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const session = request.headers.get("woocommerce-session");
  if (session) {
    headers["woocommerce-session"] = session;
  }

  const response = await fetch(getWooGraphqlUrl(), {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  const contentType = response.headers.get("content-type");

  if (contentType) {
    responseHeaders.set("Content-Type", contentType);
  }

  const wooSession = response.headers.get("woocommerce-session");
  if (wooSession) {
    responseHeaders.set("woocommerce-session", wooSession);
  }

  return new Response(await response.text(), {
    status: response.status,
    headers: responseHeaders,
  });
}
