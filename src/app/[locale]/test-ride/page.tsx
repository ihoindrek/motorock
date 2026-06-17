import { TestRideView } from "@/components/shop/test-ride-view";

export const metadata = {
  title: "Book a test ride",
  description:
    "Book a motorcycle test ride at Motorock showroom in Tallinn.",
};

type TestRidePageProps = {
  searchParams: Promise<{
    slug?: string;
    bike?: string;
    brand?: string;
    color?: string;
  }>;
};

export default async function TestRidePage({ searchParams }: TestRidePageProps) {
  const params = await searchParams;

  return (
    <TestRideView
      initial={{
        slug: params.slug,
        bike: params.bike,
        brand: params.brand,
        color: params.color,
      }}
    />
  );
}
