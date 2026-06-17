export function buildTestRideUrl({
  slug,
  name,
  brand,
  color,
}: {
  slug: string;
  name: string;
  brand: string;
  color?: string;
}) {
  const params = new URLSearchParams({
    slug,
    bike: name,
    brand,
  });

  if (color?.trim()) {
    params.set("color", color.trim());
  }

  return `/test-ride?${params.toString()}`;
}
