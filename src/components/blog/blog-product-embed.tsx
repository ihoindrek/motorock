import { ProductCard } from "@/components/shop/product-card";
import { getProductBySlugForLocale } from "@/lib/graphql/products";
import type { Locale } from "@/i18n/config";
import type { CatalogProduct } from "@/types/catalog-product";

type BlogProductEmbedProps = {
  slugs: string[];
  locale: Locale;
};

/** Live product cards embedded in blog content via [motorock_products slugs="…"]. */
export async function BlogProductEmbed({ slugs, locale }: BlogProductEmbedProps) {
  const results = await Promise.all(
    slugs.slice(0, 6).map(async (slug) => {
      try {
        return await getProductBySlugForLocale(slug, locale);
      } catch {
        return undefined;
      }
    }),
  );

  const products = results.filter(
    (product): product is CatalogProduct => Boolean(product),
  );

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="not-prose my-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
