import { isLocale } from "@/i18n/config";
import {
  getCatalogProductsBySlugs,
  getEquipmentCatalog,
  getProductBySlug,
  getSimilarProducts,
} from "@/lib/graphql/products";
import { pickCartComplementaryProducts } from "@/lib/shop/cart-complementary-products";
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

    const cartProducts = exclude.size
      ? await getCatalogProductsBySlugs([...exclude], locale)
      : [];
    const cartCategories = new Set<ProductCategory>(
      cartProducts.map((item) => item.category),
    );

    let suggestions =
      product.type === "equipment"
        ? pickCartComplementaryProducts(
            product,
            await getEquipmentCatalog(locale),
            {
              excludeSlugs: exclude,
              cartCategories,
              limit: 6,
            },
          )
        : [];

    if (suggestions.length < 6) {
      const similar = await getSimilarProducts(product, 8, locale);
      const seen = new Set(suggestions.map((item) => item.slug));

      for (const candidate of similar) {
        if (suggestions.length >= 6) {
          break;
        }

        if (exclude.has(candidate.slug) || seen.has(candidate.slug)) {
          continue;
        }

        if (
          product.type === "equipment" &&
          (candidate.category === product.category ||
            cartCategories.has(candidate.category))
        ) {
          continue;
        }

        suggestions.push(candidate);
        seen.add(candidate.slug);
      }
    }

    if (product.type === "motorcycle" && suggestions.length === 0) {
      suggestions = await getSimilarProducts(product, 6, locale);
    }

    const products = suggestions
      .filter((candidate) => !exclude.has(candidate.slug))
      .slice(0, 6)
      .map((candidate) => toSuggestionProduct(candidate))
      .filter((candidate): candidate is CartSuggestionProduct => candidate !== null);

    return Response.json({ products });
  } catch (error) {
    console.error("[cart/suggestions] fetch failed:", error);
    return Response.json(
      { products: [] as CartSuggestionProduct[], error: "Suggestions unavailable" },
      { status: 503 },
    );
  }
}
