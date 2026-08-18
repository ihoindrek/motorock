import { getStorefrontUrl, getWooGraphqlUrl } from "@/lib/storefront/url";

export type HealthCheckResult = {
  id: string;
  ok: boolean;
  message: string;
  durationMs: number;
};

export type StorefrontHealthReport = {
  ok: boolean;
  checkedAt: string;
  checks: HealthCheckResult[];
};

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

async function checkGraphqlProducts() {
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
  });

  if (!response.ok) {
    return { ok: false, message: `GraphQL HTTP ${response.status}` };
  }

  const payload = (await response.json()) as {
    errors?: { message: string }[];
    data?: { products?: { nodes?: { slug?: string }[] } };
  };

  if (payload.errors?.length && !payload.data) {
    return {
      ok: false,
      message: payload.errors.map((entry) => entry.message).join("; "),
    };
  }

  const count = payload.data?.products?.nodes?.length ?? 0;
  if (count === 0) {
    return { ok: false, message: "GraphQL returned 0 motorcycle products" };
  }

  return { ok: true, message: `${count} motorcycle products reachable` };
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

  return {
    ok: checks.every((check) => check.ok),
    checkedAt: new Date().toISOString(),
    checks,
  };
}

export function summarizeHealthReport(report: StorefrontHealthReport) {
  const failed = report.checks.filter((check) => !check.ok);
  if (failed.length === 0) {
    return "Kõik tervisekontrollid OK";
  }

  return failed.map((check) => `${check.id}: ${check.message}`).join("\n");
}
