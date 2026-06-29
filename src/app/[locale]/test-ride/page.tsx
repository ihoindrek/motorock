import { TestRideView } from "@/components/shop/test-ride-view";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return {};
  }

  const dict = getDictionary(localeParam);

  return {
    title: dict.pages.testRideTitle,
    description: dict.pages.testRideDescription,
  };
}

type TestRidePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    slug?: string;
    bike?: string;
    brand?: string;
    color?: string;
  }>;
};

export default async function TestRidePage({
  searchParams,
}: TestRidePageProps) {
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
