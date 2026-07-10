import { ProductPageLoading } from "@/components/shop/product-page-loading";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-request-locale";

export default async function ToodeProductLoadingPage() {
  const locale = await getRequestLocale();
  const dict = getDictionary(locale);

  return <ProductPageLoading ariaLabel={dict.common.loadingProducts} />;
}
