import { EquipmentHubLoading } from "@/components/shop/equipment-hub-loading";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-request-locale";

export default async function TootekategooriaHubLoadingPage() {
  const locale = await getRequestLocale();
  const dict = getDictionary(locale);

  return <EquipmentHubLoading ariaLabel={dict.common.loadingCategories} />;
}
