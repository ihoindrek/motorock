/** Server-side Places API key (prefer dedicated secret; Maps key as fallback). */
export function getGooglePlacesApiKey(): string | undefined {
  return (
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    undefined
  );
}
