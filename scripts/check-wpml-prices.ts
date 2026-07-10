import { parseGraphqlPrice } from "@/lib/shop/parse-graphql-price";

type GqlProduct = {
  databaseId: number;
  name: string;
  slug: string;
  languageCode?: string | null;
  price?: string | null;
  regularPrice?: string | null;
  translations?: Array<{
    databaseId?: number | null;
    slug?: string | null;
    language?: { code?: string | null } | null;
  }> | null;
};

async function gql<T>(query: string, variables: Record<string, unknown> = {}) {
  const response = await fetch("https://motorock.eu/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await response.json()) as {
    data?: T;
    errors?: { message: string }[];
  };

  if (json.errors?.length) {
    throw new Error(json.errors.map((error) => error.message).join("; "));
  }

  return json.data as T;
}

function translationId(node: GqlProduct, locale: "en" | "et") {
  const language = node.languageCode?.toLowerCase();
  if (language === locale) {
    return node.databaseId;
  }

  const match = node.translations?.find(
    (entry) => entry.language?.code?.toLowerCase() === locale,
  );

  return match?.databaseId ?? null;
}

async function fetchAllProducts() {
  const all: GqlProduct[] = [];
  let after: string | null = null;

  for (;;) {
    const data = await gql<{
      products: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: GqlProduct[];
      };
    }>(
      `
        query ($first: Int!, $after: String) {
          products(first: $first, after: $after, where: { status: "publish" }) {
            pageInfo { hasNextPage endCursor }
            nodes {
              ... on Product {
                databaseId
                name
                slug
                languageCode
                translations { databaseId slug language { code } }
              }
              ... on SimpleProduct { price regularPrice }
              ... on VariableProduct { price regularPrice }
            }
          }
        }
      `,
      { first: 100, after },
    );

    all.push(...data.products.nodes);

    if (!data.products.pageInfo.hasNextPage) {
      break;
    }

    after = data.products.pageInfo.endCursor;
  }

  return all;
}

async function fetchProductById(id: number) {
  const data = await gql<{ product: GqlProduct | null }>(
    `
      query ($id: ID!) {
        product(id: $id, idType: DATABASE_ID) {
          ... on Product {
            databaseId
            name
            slug
            languageCode
            translations { databaseId slug language { code } }
          }
          ... on SimpleProduct { price regularPrice }
          ... on VariableProduct { price regularPrice }
        }
      }
    `,
    { id },
  );

  return data.product;
}

async function resolveProduct(
  id: number,
  byId: Map<number, GqlProduct>,
  cache: Map<number, GqlProduct | null>,
) {
  const existing = byId.get(id) ?? cache.get(id);
  if (existing) {
    return existing;
  }

  const fetched = await fetchProductById(id);
  cache.set(id, fetched);
  return fetched;
}

async function main() {
  const all = await fetchAllProducts();
  const byId = new Map(all.map((product) => [product.databaseId, product]));
  const fetched = new Map<number, GqlProduct | null>();

  const pairs = new Map<string, { enId: number; etId: number }>();

  for (const node of all) {
    const enId = translationId(node, "en");
    const etId = translationId(node, "et");

    if (!enId || !etId) {
      continue;
    }

    const key = [enId, etId].sort((left, right) => left - right).join(":");

    if (!pairs.has(key)) {
      pairs.set(key, { enId, etId });
    }
  }

  const mismatches: Array<{
    enId: number;
    etId: number;
    enSlug: string;
    etSlug: string;
    name: string;
    enPrice: number;
    etPrice: number;
    diff: number;
  }> = [];

  let checked = 0;

  for (const { enId, etId } of pairs.values()) {
    const en = await resolveProduct(enId, byId, fetched);
    const et = await resolveProduct(etId, byId, fetched);

    if (!en || !et) {
      continue;
    }

    checked += 1;

    const enPrice = parseGraphqlPrice(en.regularPrice ?? en.price);
    const etPrice = parseGraphqlPrice(et.regularPrice ?? et.price);

    if (enPrice <= 0 && etPrice <= 0) {
      continue;
    }

    if (Math.abs(enPrice - etPrice) > 0.01) {
      mismatches.push({
        enId,
        etId,
        enSlug: en.slug,
        etSlug: et.slug,
        name: en.name || et.name,
        enPrice,
        etPrice,
        diff: Number((enPrice - etPrice).toFixed(2)),
      });
    }
  }

  mismatches.sort((left, right) => Math.abs(right.diff) - Math.abs(left.diff));

  const etLower = mismatches.filter((m) => m.etPrice < m.enPrice).length;
  const etHigher = mismatches.filter((m) => m.etPrice > m.enPrice).length;
  const ratioLow = mismatches.filter(
    (m) => m.etPrice < m.enPrice && m.enPrice / m.etPrice > 2,
  ).length;

  console.log(`Catalog products fetched: ${all.length}`);
  console.log(`Translation pairs: ${pairs.size}`);
  console.log(`Pairs checked (both sides fetched): ${checked}`);
  console.log(`Price mismatches: ${mismatches.length}`);
  console.log(`  ET lower than EN: ${etLower}`);
  console.log(`  ET higher than EN: ${etHigher}`);
  console.log(`  ET < 50% of EN (ratio > 2x): ${ratioLow}`);
  console.log(`Pairs with matching prices: ${checked - mismatches.length}`);
  console.log("---");

  for (const mismatch of mismatches) {
    console.log(
      `${mismatch.name} | EN ${mismatch.enPrice.toFixed(2)} € (#${mismatch.enId}, ${mismatch.enSlug}) vs ET ${mismatch.etPrice.toFixed(2)} € (#${mismatch.etId}, ${mismatch.etSlug}) | diff ${mismatch.diff.toFixed(2)}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
