import { notFound } from "next/navigation";
import { WishlistView } from "@/components/shop/wishlist-view";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

type WishlistPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: WishlistPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    return {};
  }

  const dict = getDictionary(localeParam);

  return {
    title: dict.pages.wishlistTitle,
    description: dict.pages.wishlistDescription,
    robots: { index: false, follow: false },
  };
}

export default async function WishlistPage({ params }: WishlistPageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  return <WishlistView />;
}
