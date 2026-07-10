#!/usr/bin/env node

const ENDPOINT = process.env.WOOCOMMERCE_GRAPHQL_URL ?? "https://motorock.eu/graphql";

async function gql(query, variables = {}) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  return payload.data;
}

function normalize(html = "") {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[#\w]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function sameContent(left, right) {
  return (
    normalize(left?.shortDescription) === normalize(right?.shortDescription) &&
    normalize(left?.description) === normalize(right?.description)
  );
}

const PRODUCT_BY_SLUG = `
  query ProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      databaseId
      slug
      languageCode
      shortDescription
      description
      translations {
        databaseId
        language { code }
      }
    }
  }
`;

const PRODUCT_BY_ID = `
  query ProductByDatabaseId($id: ID!) {
    product(id: $id, idType: DATABASE_ID) {
      databaseId
      slug
      languageCode
      shortDescription
      description
    }
  }
`;

async function fetchLocalized(slug, locale) {
  const { product: remote } = await gql(PRODUCT_BY_SLUG, { slug });

  if (!remote) {
    return null;
  }

  const language = remote.languageCode?.toLowerCase() ?? "en";

  if (language === locale) {
    return remote;
  }

  const translationId = remote.translations?.find(
    (entry) => entry.language?.code === locale,
  )?.databaseId;

  if (!translationId) {
    return locale === "et" && language === "en" ? remote : null;
  }

  const { product } = await gql(PRODUCT_BY_ID, { id: translationId });

  return product?.languageCode?.toLowerCase() === locale ? product : null;
}

async function loadMotorcycleSlugs() {
  const slugs = [];
  let after = null;

  for (;;) {
    const data = await gql(
      `query MotorcycleSlugs($after: String) {
        products(first: 100, after: $after, where: { category: "motorcycles", status: "publish" }) {
          pageInfo { hasNextPage endCursor }
          nodes { ... on Product { slug languageCode } }
        }
      }`,
      { after },
    );

    for (const node of data.products.nodes) {
      if ((node.languageCode ?? "en") === "en") {
        slugs.push(node.slug);
      }
    }

    if (!data.products.pageInfo.hasNextPage) {
      break;
    }

    after = data.products.pageInfo.endCursor;
  }

  return [...new Set(slugs)].sort();
}

async function main() {
  const slugs = await loadMotorcycleSlugs();
  const translated = [];
  const untranslated = [];
  const failed = [];

  for (const slug of slugs) {
    const english = await fetchLocalized(slug, "en");
    const estonian = await fetchLocalized(slug, "et");

    if (!estonian) {
      failed.push(slug);
      continue;
    }

    if (sameContent(english, estonian)) {
      untranslated.push(slug);
    } else {
      translated.push(slug);
    }
  }

  console.log(`Motorcycles audited: ${slugs.length}`);
  console.log(`ET unique content: ${translated.length}`);
  console.log(`ET same as EN (needs WP copy): ${untranslated.length}`);
  console.log(`ET fetch failed: ${failed.length}`);

  if (untranslated.length > 0) {
    console.log("\nNeeds WordPress ET translation:");
    for (const slug of untranslated) {
      console.log(`- ${slug}`);
    }
  }

  if (failed.length > 0) {
    console.log("\nMissing ET product:");
    for (const slug of failed) {
      console.log(`- ${slug}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
