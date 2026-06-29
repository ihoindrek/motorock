const DEFAULT_ENDPOINT = "https://motorock.eu/graphql";
const SESSION_STORAGE_KEY = "motorock-wc-session";
const SYNCED_LINES_KEY = "motorock-wc-synced-lines";

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export function getCheckoutGraphqlEndpoint() {
  return process.env.NEXT_PUBLIC_WOOCOMMERCE_GRAPHQL_URL ?? DEFAULT_ENDPOINT;
}

export function readWooSessionToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(SESSION_STORAGE_KEY);
}

export function writeWooSessionToken(token: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, token);
  } else {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(SYNCED_LINES_KEY);
  }
}

export function readSyncedCartLinesKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(SYNCED_LINES_KEY);
}

export function writeSyncedCartLinesKey(linesKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(SYNCED_LINES_KEY, linesKey);
}

export async function checkoutGraphqlRequest<
  TData,
  TVariables = Record<string, unknown>,
>(
  query: string,
  variables?: TVariables,
  sessionToken?: string | null,
): Promise<{ data: TData; sessionToken: string | null }> {
  const token = sessionToken ?? readWooSessionToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["woocommerce-session"] = `Session ${token}`;
  }

  const response = await fetch(getCheckoutGraphqlEndpoint(), {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GraphQL HTTP ${response.status}`);
  }

  const nextSession =
    response.headers.get("woocommerce-session") ??
    response.headers.get("Woocommerce-Session");

  if (nextSession) {
    const normalized = nextSession.replace(/^Session\s+/i, "");
    writeWooSessionToken(normalized);
  }

  const payload = (await response.json()) as GraphQLResponse<TData>;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  if (!payload.data) {
    throw new Error("GraphQL response missing data");
  }

  return {
    data: payload.data,
    sessionToken: readWooSessionToken(),
  };
}
