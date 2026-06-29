type DpdParcelShop = {
  parcelShopId: string;
  companyName: string;
  companyShortName?: string;
  street: string;
  houseNo?: string;
  city: string;
  zipCode: string;
  countryCode: string;
};

let cache: { fetchedAt: number; shops: DpdParcelShop[] } | null = null;
const CACHE_MS = 1000 * 60 * 60 * 6;

export async function fetchDpdPickupPoints(country: string) {
  const now = Date.now();

  if (!cache || now - cache.fetchedAt >= CACHE_MS) {
    const response = await fetch(
      "https://dpdbaltics.com/PickupParcelShopData.json",
      {
        headers: { "User-Agent": "MotorockCheckout/1.0" },
        next: { revalidate: 60 * 60 * 6 },
      },
    );

    if (!response.ok) {
      throw new Error("Could not load DPD pickup points");
    }

    cache = {
      fetchedAt: now,
      shops: (await response.json()) as DpdParcelShop[],
    };
  }

  return cache.shops
    .filter((shop) => shop.countryCode?.toUpperCase() === country.toUpperCase())
    .map((shop) => ({
      id: shop.parcelShopId,
      name: shop.companyShortName || shop.companyName,
      address: [shop.street, shop.houseNo].filter(Boolean).join(" ").trim(),
      city: shop.city,
      postcode: shop.zipCode,
      carrier: "dpd" as const,
    }))
    .filter((point) => point.postcode && point.city && point.name);
}
