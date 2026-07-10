#!/usr/bin/env node

const baseUrl = (
  process.env.REVALIDATE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://motorock.eu"
).replace(/\/$/, "");

const secret =
  process.env.REVALIDATE_SECRET ?? process.env.WOOCOMMERCE_WEBHOOK_SECRET;

if (!secret) {
  console.error(
    "Set REVALIDATE_SECRET or WOOCOMMERCE_WEBHOOK_SECRET in the environment.",
  );
  process.exit(1);
}

const endpoint = `${baseUrl}/api/revalidate/woocommerce`;

const response = await fetch(endpoint, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${secret}`,
  },
});

const body = await response.text();

if (!response.ok) {
  console.error(`Revalidate failed (${response.status}): ${body}`);
  process.exit(1);
}

console.log(body);
