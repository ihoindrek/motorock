import { getWooGraphqlUrl } from "@/lib/storefront/url";

const DEFAULT_REVALIDATE_SECONDS = 300;
const DEFAULT_RETRY_ATTEMPTS = 3;

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export function getGraphqlEndpoint() {
  return getWooGraphqlUrl();
}

type GraphqlRequestInit = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  /** Override transient network retries (default 3). Set 1 to disable. */
  retryAttempts?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const RETRYABLE_GRAPHQL_HTTP_STATUSES = new Set([500, 502, 503, 504]);

function isTransientFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const cause =
    "cause" in error && error.cause instanceof Error
      ? `${error.cause.name} ${error.cause.message} ${error.cause.stack ?? ""}`
      : String((error as { cause?: unknown }).cause ?? "");
  const haystack = `${error.name} ${error.message} ${cause}`.toLowerCase();

  return (
    haystack.includes("fetch failed") ||
    haystack.includes("und_err_socket") ||
    haystack.includes("other side closed") ||
    haystack.includes("econnreset") ||
    haystack.includes("econnrefused") ||
    haystack.includes("etimedout") ||
    haystack.includes("socket hang up") ||
    haystack.includes("network")
  );
}

function isRetryableGraphqlError(error: unknown): boolean {
  if (isTransientFetchError(error)) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const match = error.message.match(/^GraphQL HTTP (\d{3})$/);
  if (!match) {
    return false;
  }

  return RETRYABLE_GRAPHQL_HTTP_STATUSES.has(Number(match[1]));
}

async function graphqlRequestOnce<TData, TVariables>(
  query: string,
  variables: TVariables | undefined,
  init: GraphqlRequestInit | undefined,
): Promise<TData> {
  const nextOptions = init?.next ?? {};
  const cacheTags = new Set(["woocommerce", ...(nextOptions.tags ?? [])]);

  const response = await fetch(getGraphqlEndpoint(), {
    ...init,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify({ query, variables }),
    next: {
      revalidate: nextOptions.revalidate ?? DEFAULT_REVALIDATE_SECONDS,
      tags: [...cacheTags],
    },
  });

  if (!response.ok) {
    throw new Error(`GraphQL HTTP ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLResponse<TData>;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  if (!payload.data) {
    throw new Error("GraphQL response missing data");
  }

  return payload.data;
}

export async function graphqlRequest<TData, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
  init?: GraphqlRequestInit,
): Promise<TData> {
  const attempts = Math.max(1, init?.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS);
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await graphqlRequestOnce<TData, TVariables>(query, variables, init);
    } catch (error) {
      lastError = error;

      if (!isRetryableGraphqlError(error) || attempt === attempts - 1) {
        throw error;
      }

      await sleep(250 * 2 ** attempt);
    }
  }

  throw lastError;
}
