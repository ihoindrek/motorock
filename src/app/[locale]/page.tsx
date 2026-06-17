import { Hero } from "@/components/hero";
import { RidersFavorites } from "@/components/riders-favorites";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { notFound } from "next/navigation";

export const revalidate = 300;

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: HomePageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  return (
    <>
      <Hero locale={localeParam} dictionary={getDictionary(localeParam)} />
      <RidersFavorites locale={localeParam} />
    </>
  );
}
