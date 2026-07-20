import { getRequestCountry } from "@/lib/geo/request-country";

/**
 * Visitor country from the Vercel edge header. Product pages are static
 * (ISR), so geo detection happens client-side via this endpoint.
 */
export async function GET() {
  const country = await getRequestCountry("EE");

  return Response.json(
    { country },
    { headers: { "Cache-Control": "private, max-age=3600" } },
  );
}
