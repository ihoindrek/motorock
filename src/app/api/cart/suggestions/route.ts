import { isLocale } from "@/i18n/config";
import {
  getEquipmentCatalog,
  getMotorcycleCatalog,
  getProductBySlug,
} from "@/lib/graphql/products";
import {
  mergeSuggestionCandidates,
  pickCartComplementaryProducts,
} from "@/lib/shop/cart-complementary-products";
import { pickSimilarProducts } from "@/lib/shop/similar-products";
import type { ProductCategory } from "@/types/catalog-product";

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

function resolveCartCategories(
  exclude: ReadonlySet<string>,
  catalog: readonly { slug: string; category: ProductCategory }[],
) {
  const bySlug = new Map(catalog.map((product) => [product.slug, product.category]));

  return new Set(
    [...exclude]
      .map((slug) => bySlug.get(slug))
      .filter((category): category is ProductCategory => Boolean(category)),
  );
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

    const catalog =
      product.type === "motorcycle"
        ? await getMotorcycleCatalog(locale)
        : await getEquipmentCatalog(locale);

    const cartCategories = resolveCartCategories(exclude, catalog);

    let suggestions =
      product.type === "equipment"
        ? pickCartComplementaryProducts(product, catalog, {
            excludeSlugs: exclude,
            cartCategories,
            limit: 6,
          })
        : [];

    if (suggestions.length < 6) {
      const similar = pickSimilarProducts(product, catalog, 12);
      suggestions = mergeSuggestionCandidates(product, suggestions, similar, {
        excludeSlugs: exclude,
        cartCategories,
        limit: 6,
      });
    }

    if (product.type === "motorcycle" && suggestions.length === 0) {
      suggestions = pickSimilarProducts(product, catalog, 6);
    }

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
