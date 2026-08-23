import { getStorefrontUrl, getWooGraphqlUrl } from "@/lib/storefront/url";

export type HealthCheckResult = {
  id: string;
  ok: boolean;
  message: string;
  durationMs: number;
};

export type StorefrontHealthReport = {
  ok: boolean;
  /** WP GraphQL direct probes failed while lightweight storefront checks passed. */
  degraded?: boolean;
  checkedAt: string;
  checks: HealthCheckResult[];
};

const USER_FACING_CHECK_IDS = [
  "storefront-about",
  "checkout-montonio-methods",
] as const;

const WP_GRAPHQL_CHECK_IDS = ["graphql-products", "graphql-categories"] as const;

const GRAPHQL_HEALTH_TIMEOUT_MS = 15_000;
const GRAPHQL_HEALTH_ATTEMPTS = 3;

export function includesAnyMarker(content: string, markers: readonly string[]) {
  return markers.some((marker) => content.includes(marker));
}

async function timedCheck(
  id: string,
  run: () => Promise<{ ok: boolean; message: string }>,
): Promise<HealthCheckResult> {
  const started = Date.now();

  try {
    const result = await run();
    return {
      id,
      ok: result.ok,
      message: result.message,
      durationMs: Date.now() - started,
    };
  } catch (error) {
    return {
      id,
      ok: false,
      message: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - started,
    };
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientFetchFailure(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const haystack = `${error.name} ${error.message} ${error.cause ?? ""}`.toLowerCase();
  return (
    haystack.includes("fetch failed") ||
    haystack.includes("aborted") ||
    haystack.includes("timeout") ||
    haystack.includes("econnreset") ||
    haystack.includes("socket")
  );
}

async function fetchGraphqlHealth<TData>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<TData> {
  const response = await fetch(getWooGraphqlUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
    signal: AbortSignal.timeout(GRAPHQL_HEALTH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`GraphQL HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    errors?: { message: string }[];
    data?: TData;
  };

  if (payload.errors?.length && !payload.data) {
    throw new Error(payload.errors.map((entry) => entry.message).join("; "));
  }

  if (!payload.data) {
    throw new Error("GraphQL response missing data");
  }

  return payload.data;
}

async function runGraphqlHealthCheck(
  run: () => Promise<string>,
): Promise<{ ok: boolean; message: string }> {
  let lastError: unknown;

  for (let attempt = 0; attempt < GRAPHQL_HEALTH_ATTEMPTS; attempt += 1) {
    try {
      const message = await run();
      return { ok: true, message };
    } catch (error) {
      lastError = error;

      if (!isTransientFetchFailure(error) || attempt === GRAPHQL_HEALTH_ATTEMPTS - 1) {
        break;
      }

      await sleep(250 * 2 ** attempt);
    }
  }

  return {
    ok: false,
    message: lastError instanceof Error ? lastError.message : String(lastError),
  };
}

async function checkGraphqlProducts() {
  return runGraphqlHealthCheck(async () => {
    const data = await fetchGraphqlHealth<{
      products?: { nodes?: { slug?: string }[] };
    }>(
      `query HealthProducts($first: Int!) {
        products(first: $first, where: { status: "publish", category: "motorcycles" }) {
          nodes { slug }
        }
      }`,
      { first: 3 },
    );

    const count = data.products?.nodes?.length ?? 0;
    if (count === 0) {
      throw new Error("GraphQL returned 0 motorcycle products");
    }

    return `${count} motorcycle products reachable`;
  });
}

async function checkGraphqlCategories() {
  return runGraphqlHealthCheck(async () => {
    const data = await fetchGraphqlHealth<{
      productCategories?: { nodes?: { slug?: string; name?: string }[] };
    }>(`query HealthCategories {
      productCategories(first: 1, where: { slug: "for-men" }) {
        nodes { slug name }
      }
    }`);

    const category = data.productCategories?.nodes?.[0];
    if (!category?.slug) {
      throw new Error("GraphQL returned 0 equipment categories");
    }

    return `Category "${category.slug}" reachable`;
  });
}

async function checkStorefrontAbout() {
  const response = await fetch(`${getStorefrontUrl()}/en/about`, {
    cache: "no-store",
    headers: { "user-agent": "motorock-health-check" },
  });

  if (!response.ok) {
    return { ok: false, message: `About page HTTP ${response.status}` };
  }

  const html = await response.text();

  if (!includesAnyMarker(html, ["Motorock", "motorock"])) {
    return { ok: false, message: "About page missing storefront marker" };
  }

  return { ok: true, message: "Storefront about page reachable" };
}

async function checkCheckoutMontonioMethods() {
  const response = await fetch(
    `${getStorefrontUrl()}/api/checkout/montonio-payment-methods?country=EE`,
    {
      cache: "no-store",
      headers: { "user-agent": "motorock-health-check" },
    },
  );

  if (!response.ok) {
    return { ok: false, message: `Montonio methods HTTP ${response.status}` };
  }

  const payload = (await response.json()) as {
    configured?: boolean;
    options?: Array<{ kind?: string }>;
    error?: string;
  };

  if (payload.error) {
    return { ok: false, message: payload.error };
  }

  if (!payload.configured) {
    return {
      ok: false,
      message: "Montonio payment methods API is not configured",
    };
  }

  const bankCount =
    payload.options?.filter((option) => option.kind === "bank").length ?? 0;

  if (bankCount === 0) {
    return {
      ok: false,
      message: "Montonio returned 0 bank payment options for EE",
    };
  }

  return {
    ok: true,
    message: `${bankCount} Montonio bank options for EE`,
  };
}

export async function runStorefrontHealthChecks(): Promise<StorefrontHealthReport> {
  const checks = await Promise.all([
    timedCheck("graphql-products", checkGraphqlProducts),
    timedCheck("graphql-categories", checkGraphqlCategories),
    timedCheck("storefront-about", checkStorefrontAbout),
    timedCheck("checkout-montonio-methods", checkCheckoutMontonioMethods),
  ]);

  const userFacingOk = USER_FACING_CHECK_IDS.every(
    (id) => checks.find((check) => check.id === id)?.ok,
  );
  const graphqlOk = WP_GRAPHQL_CHECK_IDS.every(
    (id) => checks.find((check) => check.id === id)?.ok,
  );
  const graphqlPartialOk = WP_GRAPHQL_CHECK_IDS.some(
    (id) => checks.find((check) => check.id === id)?.ok,
  );

  return {
    ok: userFacingOk && graphqlPartialOk,
    degraded: userFacingOk && graphqlPartialOk && !graphqlOk,
    checkedAt: new Date().toISOString(),
    checks,
  };
}

export function summarizeHealthReport(report: StorefrontHealthReport) {
  const failed = report.checks.filter((check) => !check.ok);
  if (failed.length === 0) {
    return "Kõik tervisekontrollid OK";
  }

  if (report.degraded) {
    return [
      "Storefront OK, kuid mõni Woo GraphQL otsepäring ebaõnnestus.",
      ...failed.map((check) => `${check.id}: ${check.message}`),
    ].join("\n");
  }

  return failed.map((check) => `${check.id}: ${check.message}`).join("\n");
}
