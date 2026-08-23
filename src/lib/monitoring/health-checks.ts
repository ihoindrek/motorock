import { getStorefrontUrl, getWooGraphqlUrl } from "@/lib/storefront/url";

export type HealthCheckResult = {
  id: string;
  ok: boolean;
  message: string;
  durationMs: number;
};

export type StorefrontHealthReport = {
  ok: boolean;
  /** WP GraphQL direct probe failed while user-facing storefront checks passed. */
  degraded?: boolean;
  checkedAt: string;
  checks: HealthCheckResult[];
};

const USER_FACING_CHECK_IDS = [
  "homepage-en",
  "homepage-et",
  "motorcycles-catalog",
  "checkout-montonio-methods",
] as const;

const GRAPHQL_HEALTH_TIMEOUT_MS = 15_000;
const GRAPHQL_HEALTH_ATTEMPTS = 3;

const HOMEPAGE_MARKERS = {
  en: ["Popular Bikes", "favorites-motorcycles", "/en/product/", "/en/toode/"],
  et: ["Populaarsed rattad", "favorites-motorcycles", "/et/product/", "/et/toode/"],
} as const;

export function includesAnyMarker(content: string, markers: readonly string[]) {
  return markers.some((marker) => content.includes(marker));
}

function countMatches(content: string, pattern: RegExp) {
  return [...content.matchAll(pattern)].length;
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

async function fetchGraphqlProductsOnce() {
  const response = await fetch(getWooGraphqlUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query HealthProducts($first: Int!) {
        products(first: $first, where: { status: "publish", category: "motorcycles" }) {
          nodes { slug }
        }
      }`,
      variables: { first: 3 },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(GRAPHQL_HEALTH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`GraphQL HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    errors?: { message: string }[];
    data?: { products?: { nodes?: { slug?: string }[] } };
  };

  if (payload.errors?.length && !payload.data) {
    throw new Error(payload.errors.map((entry) => entry.message).join("; "));
  }

  const count = payload.data?.products?.nodes?.length ?? 0;
  if (count === 0) {
    throw new Error("GraphQL returned 0 motorcycle products");
  }

  return `${count} motorcycle products reachable`;
}

async function checkGraphqlProducts() {
  let lastError: unknown;

  for (let attempt = 0; attempt < GRAPHQL_HEALTH_ATTEMPTS; attempt += 1) {
    try {
      const message = await fetchGraphqlProductsOnce();
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

async function checkHomepageLocale(locale: "en" | "et") {
  const response = await fetch(`${getStorefrontUrl()}/${locale}`, {
    cache: "no-store",
    headers: { "user-agent": "motorock-health-check" },
  });

  if (!response.ok) {
    return { ok: false, message: `Homepage HTTP ${response.status}` };
  }

  const html = await response.text();
  const markers = HOMEPAGE_MARKERS[locale];

  if (!includesAnyMarker(html, markers)) {
    return {
      ok: false,
      message: `Homepage /${locale} is missing product markers (${markers.join(", ")})`,
    };
  }

  const productLinks = countMatches(
    html,
    new RegExp(`/${locale}/(?:product|toode)/[^"'\\s>]+`, "g"),
  );

  if (productLinks === 0) {
    return {
      ok: false,
      message: `Homepage /${locale} rendered without product links`,
    };
  }

  return {
    ok: true,
    message: `Homepage /${locale} has ${productLinks} product links`,
  };
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

async function checkMotorcycleCatalog() {
  const response = await fetch(`${getStorefrontUrl()}/en/shop/motorcycles`, {
    cache: "no-store",
    headers: { "user-agent": "motorock-health-check" },
  });

  if (!response.ok) {
    return { ok: false, message: `Motorcycles page HTTP ${response.status}` };
  }

  const html = await response.text();
  const productLinks = countMatches(html, /\/en\/(?:product|toode)\/[^"'\\s>]+/g);

  if (productLinks === 0) {
    return { ok: false, message: "Motorcycles catalog rendered without products" };
  }

  return {
    ok: true,
    message: `Motorcycles catalog has ${productLinks} product links`,
  };
}

export async function runStorefrontHealthChecks(): Promise<StorefrontHealthReport> {
  const checks = await Promise.all([
    timedCheck("graphql-products", checkGraphqlProducts),
    timedCheck("homepage-en", () => checkHomepageLocale("en")),
    timedCheck("homepage-et", () => checkHomepageLocale("et")),
    timedCheck("motorcycles-catalog", checkMotorcycleCatalog),
    timedCheck("checkout-montonio-methods", checkCheckoutMontonioMethods),
  ]);

  const userFacingOk = USER_FACING_CHECK_IDS.every(
    (id) => checks.find((check) => check.id === id)?.ok,
  );
  const graphqlOk = checks.find((check) => check.id === "graphql-products")?.ok ?? false;

  return {
    ok: userFacingOk,
    degraded: userFacingOk && !graphqlOk,
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
      "Kasutajale nähtav storefront OK, kuid Woo GraphQL otsepäring ebaõnnestus.",
      ...failed.map((check) => `${check.id}: ${check.message}`),
    ].join("\n");
  }

  return failed.map((check) => `${check.id}: ${check.message}`).join("\n");
}
