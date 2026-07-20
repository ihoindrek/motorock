import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CategoryView } from "@/components/shop/category-view";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/i18n/paths";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  fetchEquipmentCategoryIndex,
  plainTextFromHtml,
} from "@/lib/graphql/categories";
import { getEquipmentCatalogForRoute } from "@/lib/graphql/products";
import {
  buildEquipmentCategoryHref,
  equipmentRouteTreeForLocale,
  type EquipmentRouteTree,
} from "@/lib/shop/category-url";
import {
  getCanonicalEquipmentSlugSegments,
  resolveEquipmentCategoryChain,
  resolveEquipmentRoute,
} from "@/lib/shop/equipment-route";
import { buildPageMetadata } from "@/lib/seo/metadata";

type EquipmentCategoryPageArgs = {
  locale: Locale;
  slug: string[];
  routeTree: EquipmentRouteTree;
};

export async function generateEquipmentCategoryMetadata({
  locale,
  slug,
  routeTree,
}: EquipmentCategoryPageArgs): Promise<Metadata> {
  const dictionary = getDictionary(locale);
  const index = await fetchEquipmentCategoryIndex(locale);
  const route = resolveEquipmentRoute(slug, index, locale, dictionary);

  if (!route) {
    return { title: "Category not found" };
  }

  const chain =
    route.wcCategoryPath && index
      ? resolveEquipmentCategoryChain(route.wcCategoryPath, index, locale)
      : null;
  const canonicalSlug = chain
    ? getCanonicalEquipmentSlugSegments(chain, locale)
    : slug;

  return buildPageMetadata({
    locale,
    title: route.title,
    description: plainTextFromHtml(route.description) || undefined,
    pathname: buildEquipmentCategoryHref(locale, ...canonicalSlug),
  });
}

export async function renderEquipmentCategoryPage({
  locale,
  slug,
  routeTree,
}: EquipmentCategoryPageArgs) {
  if (equipmentRouteTreeForLocale(locale) !== routeTree) {
    const dictionary = getDictionary(locale);
    const index = await fetchEquipmentCategoryIndex(locale);
    const route = resolveEquipmentRoute(slug, index, locale, dictionary);

    if (route?.wcCategoryPath && index) {
      const chain = resolveEquipmentCategoryChain(route.wcCategoryPath, index, locale);

      if (chain) {
        redirect(
          localizedHref(
            locale,
            buildEquipmentCategoryHref(
              locale,
              ...getCanonicalEquipmentSlugSegments(chain, locale),
            ),
          ),
        );
      }
    }

    redirect(localizedHref(locale, buildEquipmentCategoryHref(locale, ...slug)));
  }

  const dictionary = getDictionary(locale);
  const index = await fetchEquipmentCategoryIndex(locale);

  // A transient GraphQL failure must not get cached as a 404 by ISR;
  // throwing keeps the previously cached page being served instead.
  if (!index && slug.length > 0) {
    throw new Error("Equipment category index unavailable");
  }

  const route = resolveEquipmentRoute(slug, index, locale, dictionary);

  if (!route) {
    notFound();
  }

  const chain =
    route.wcCategoryPath && index
      ? resolveEquipmentCategoryChain(route.wcCategoryPath, index, locale)
      : null;

  if (chain) {
    const canonicalSlug = getCanonicalEquipmentSlugSegments(chain, locale);

    if (slug.join("/") !== canonicalSlug.join("/")) {
      redirect(
        localizedHref(
          locale,
          buildEquipmentCategoryHref(locale, ...canonicalSlug),
        ),
      );
    }
  }

  const products = await getEquipmentCatalogForRoute(route, locale);

  return (
    <CategoryView
      key={slug.join("/")}
      route={route}
      products={products}
    />
  );
}
