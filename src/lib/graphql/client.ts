const DEFAULT_ENDPOINT = "https://motorock.eu/graphql";

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export function getGraphqlEndpoint() {
  return process.env.WOOCOMMERCE_GRAPHQL_URL ?? DEFAULT_ENDPOINT;
}

export async function graphqlRequest<TData, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
  init?: RequestInit,
): Promise<TData> {
  const response = await fetch(getGraphqlEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300 },
    ...init,
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
