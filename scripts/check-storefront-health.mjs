#!/usr/bin/env node

const baseUrl = (
  process.env.MONITORING_URL ??
  process.env.NEXT_PUBLIC_STOREFRONT_URL ??
  "https://motorock.eu"
).replace(/\/$/, "");

const secret =
  process.env.MONITORING_ALERT_SECRET ??
  process.env.CRON_SECRET ??
  process.env.REVALIDATE_SECRET;

if (!secret) {
  console.error(
    "Set MONITORING_ALERT_SECRET, CRON_SECRET, or REVALIDATE_SECRET in the environment.",
  );
  process.exit(1);
}

const endpoint = `${baseUrl}/api/monitoring/health?notify=0`;

const response = await fetch(endpoint, {
  headers: {
    Authorization: `Bearer ${secret}`,
  },
});

const body = await response.text();

console.log(body);

if (!response.ok) {
  process.exit(1);
}
