import { CategoryViewSkeleton } from "@/components/shop/category-view-skeleton";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-request-locale";

export default async function TootekategooriaCategoryLoadingPage() {
  const locale = await getRequestLocale();
  const dict = getDictionary(locale);

  return <CategoryViewSkeleton loadingLabel={dict.common.loadingProducts} />;
}
