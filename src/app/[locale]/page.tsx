import type { Metadata } from "next";
import { Suspense } from "react";
import { LatestBlogPostsSection } from "@/components/blog/latest-blog-posts-section";
import { ShowroomGoogleReviewsSection } from "@/components/contact/showroom-google-reviews-section";
import { Hero } from "@/components/hero";
import { HomeBelowFoldSkeleton } from "@/components/home-below-fold-skeleton";
import { HomeTrustBar } from "@/components/home-trust-bar";
import { RidersFavorites } from "@/components/riders-favorites";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { notFound } from "next/navigation";

export const revalidate = 300;

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return {};
  }

  const dict = getDictionary(localeParam);

  return buildPageMetadata({
    locale: localeParam,
    title: dict.seo.homeTitle,
    description: dict.seo.homeDescription,
    pathname: "/",
  });
}

export default async function Home({ params }: HomePageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const dictionary = getDictionary(localeParam);

  return (
    <>
      <Hero locale={localeParam} dictionary={dictionary} />
      <HomeTrustBar locale={localeParam} />
      <Suspense fallback={<HomeBelowFoldSkeleton />}>
        <RidersFavorites locale={localeParam} />
      </Suspense>
      <div className="bg-white">
        <Suspense fallback={<HomeBelowFoldSkeleton />}>
          <ShowroomGoogleReviewsSection locale={localeParam} />
        </Suspense>
        <Suspense fallback={<HomeBelowFoldSkeleton />}>
          <LatestBlogPostsSection locale={localeParam} />
        </Suspense>
      </div>
    </>
  );
}
