import Link from "next/link";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, localeCookieName } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { localizedHref } from "@/i18n/paths";

export default async function NotFound() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <div className="site-container flex min-h-[50vh] flex-col items-start justify-center py-16">
      <p className="section-eyebrow">404</p>
      <h1 className="heading-category mt-3 text-4xl sm:text-5xl">
        {dict.notFound.title}
      </h1>
      <p className="mt-4 max-w-md text-base text-ink/65">
        {dict.notFound.description}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={localizedHref(locale, "/shop/equipment")}
          className="btn-accent"
        >
          {dict.notFound.shopEquipment}
        </Link>
        <Link href={localizedHref(locale, "/search")} className="btn-ghost">
          {dict.notFound.search}
        </Link>
      </div>
    </div>
  );
}
