const DEFAULT_ADMIN_ORIGINS = ["https://shop.motorock.eu"];

function allowedAdminOrigins() {
  const fromEnv = process.env.WOOCOMMERCE_ADMIN_ORIGIN?.trim();

  if (fromEnv) {
    return [fromEnv.replace(/\/$/, "")];
  }

  if (process.env.NODE_ENV === "development") {
    return [...DEFAULT_ADMIN_ORIGINS, "http://localhost", "http://127.0.0.1"];
  }

  return DEFAULT_ADMIN_ORIGINS;
}

export function isAllowedAdminOrigin(origin: string | null) {
  if (!origin) {
    return false;
  }

  const normalized = origin.replace(/\/$/, "");
  return allowedAdminOrigins().some((allowed) => allowed === normalized);
}

export function withAdminCors(request: Request, response: Response) {
  const origin = request.headers.get("origin");

  if (!isAllowedAdminOrigin(origin)) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin!);
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  headers.set("Vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function adminCorsPreflight(request: Request) {
  if (!isAllowedAdminOrigin(request.headers.get("origin"))) {
    return new Response(null, { status: 403 });
  }

  return withAdminCors(
    request,
    new Response(null, {
      status: 204,
    }),
  );
}
