import { headers } from "next/headers";

/** ISO country from Vercel edge (`x-vercel-ip-country`), else fallback. */
export async function getRequestCountry(fallback = "EE") {
  const headerStore = await headers();
  const raw = headerStore.get("x-vercel-ip-country")?.trim().toUpperCase();

  if (raw && /^[A-Z]{2}$/.test(raw) && raw !== "XX") {
    return raw;
  }

  return fallback;
}
