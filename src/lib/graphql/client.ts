import { getWooGraphqlUrl } from "@/lib/storefront/url";

const DEFAULT_REVALIDATE_SECONDS = 300;

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
};

export async function graphqlRequest<TData, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
  init?: GraphqlRequestInit,
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
