import { getWooGraphqlUrl } from "@/lib/storefront/url";

const SESSION_STORAGE_KEY = "motorock-wc-session";
const SYNCED_LINES_KEY = "motorock-wc-synced-lines";

const HTML_ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#039;": "'",
  "&#8217;": "'",
  "&#8216;": "'",
  "&#8220;": '"',
  "&#8221;": '"',
};

function decodeGraphqlErrorMessage(message: string) {
  return message.replace(/&(#?\w+);/g, (match) => HTML_ENTITY_MAP[match] ?? match);
}

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export function getCheckoutGraphqlEndpoint() {
  if (typeof window !== "undefined") {
    return new URL("/api/checkout/graphql", window.location.origin).toString();
  }

  // Server (API routes): talk to Woo directly — relative URLs are invalid in Node fetch.
  return getWooGraphqlUrl();
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

/** Drop stale Woo session after backend URL changes or expired JWT. */
export function clearCheckoutSession() {
  writeWooSessionToken(null);
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

export function clearSyncedCartLinesKey() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(SYNCED_LINES_KEY);
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

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      `GraphQL returned non-JSON (${response.status}). Check WOOCOMMERCE GraphQL URL.`,
    );
  }

  const payload = (await response.json()) as GraphQLResponse<TData>;

  if (payload.errors?.length) {
    throw new Error(
      payload.errors
        .map((error) => decodeGraphqlErrorMessage(error.message))
        .join("; "),
    );
  }

  if (!payload.data) {
    throw new Error("GraphQL response missing data");
  }

  return {
    data: payload.data,
    sessionToken: readWooSessionToken(),
  };
}
