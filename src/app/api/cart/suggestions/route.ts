import { isLocale } from "@/i18n/config";
import {
  getCatalogProductsBySlugs,
  getEquipmentCatalog,
  getMotorcycleCatalog,
  getProductBySlug,
} from "@/lib/graphql/products";
import {
  pickCuratedRelatedProducts,
  resolveCartSuggestions,
} from "@/lib/shop/cart-suggestions";

export const dynamic = "force-dynamic";

export type CartSuggestionProduct = {
  slug: string;
  name: string;
  price: number;
  image: string;
  brand: string;
  type: "equipment" | "motorcycle";
};

function toSuggestionProduct(
  product: Awaited<ReturnType<typeof getProductBySlug>>,
): CartSuggestionProduct | null {
  if (!product) {
    return null;
  }

  return {
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    brand: product.brand,
    type: product.type,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim() ?? "";
  const localeParam = searchParams.get("locale");
  const locale = isLocale(localeParam) ? localeParam : "en";
  const exclude = new Set(
    (searchParams.get("exclude") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );

  if (!slug) {
    return Response.json({ products: [] as CartSuggestionProduct[] });
  }

  try {
    const product = await getProductBySlug(slug, locale);

    if (!product) {
      return Response.json({ products: [] as CartSuggestionProduct[] });
    }

    const relatedSlugs = product.relatedSlugs?.filter((item) => !exclude.has(item)) ?? [];
    const excludeList = [...exclude];

    const [curatedRelated, excludedProducts] = await Promise.all([
      relatedSlugs.length > 0
        ? getCatalogProductsBySlugs(relatedSlugs, locale)
        : Promise.resolve([]),
      excludeList.length > 0
        ? getCatalogProductsBySlugs(excludeList, locale)
        : Promise.resolve([]),
    ]);

    const cartCategories = new Set(
      excludedProducts.map((item) => item.category),
    );

    const curatedCount = pickCuratedRelatedProducts(
      product,
      curatedRelated,
      exclude,
      6,
    ).length;
    const needsCatalog =
      product.type === "motorcycle" || curatedCount < 6;

    const catalog = needsCatalog
      ? product.type === "motorcycle"
        ? await getMotorcycleCatalog(locale)
        : await getEquipmentCatalog(locale)
      : [];

    const suggestions = resolveCartSuggestions({
      anchor: product,
      catalog,
      curatedRelated,
      excludeSlugs: exclude,
      cartCategories,
      limit: 6,
    });

    const products = suggestions
      .filter((candidate) => !exclude.has(candidate.slug))
      .slice(0, 6)
      .map((candidate) => toSuggestionProduct(candidate))
      .filter((candidate): candidate is CartSuggestionProduct => candidate !== null);

    return Response.json(
      { products },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("[cart/suggestions] fetch failed:", error);
    return Response.json(
      { products: [] as CartSuggestionProduct[], error: "Suggestions unavailable" },
      { status: 503 },
    );
  }
}
