/** List/card view — no variations; sizes/colors come from product attributes. */
const CATALOG_LIST_FIELDS = `
  ... on Product {
    databaseId
    name
    slug
    sku
    languageCode
    translations {
      slug
      name
      language {
        code
      }
    }
    image {
      sourceUrl
      altText
    }
    productCategories {
      nodes {
        name
        slug
        parent {
          node {
            slug
          }
        }
      }
    }
    metaData {
      key
      value
    }
  }
  ... on SimpleProduct {
    __typename
    price
    regularPrice
    stockStatus
    attributes {
      nodes {
        name
        options
        variation
      }
    }
  }
  ... on VariableProduct {
    __typename
    price
    regularPrice
    stockStatus
    attributes {
      nodes {
        name
        options
        variation
      }
    }
  }
`;

export const PRODUCT_BY_SLUG = `
  query ProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      databaseId
      name
      slug
      sku
      languageCode
      translations {
        slug
        name
        language {
          code
        }
      }
      shortDescription
      description
      image {
        sourceUrl
        altText
      }
      galleryImages {
        nodes {
          sourceUrl
          altText
        }
      }
      productCategories {
        nodes {
          name
          slug
          parent {
            node {
              slug
            }
          }
        }
      }
      metaData {
        key
        value
      }
      ... on SimpleProduct {
        __typename
        price
        regularPrice
        stockStatus
        attributes {
          nodes {
            name
            options
            variation
          }
        }
      }
      ... on VariableProduct {
        __typename
        price
        regularPrice
        stockStatus
        attributes {
          nodes {
            name
            options
            variation
          }
        }
        variations(first: 50) {
          nodes {
            databaseId
            sku
            name
            price
            regularPrice
            stockStatus
            image {
              sourceUrl
              altText
            }
            attributes {
              nodes {
                name
                value
              }
            }
          }
        }
      }
    }
  }
`;

export const PRODUCT_CATALOG_PAGE = `
  query ProductCatalogPage($first: Int!, $after: String, $category: String, $categoryNotIn: [String]) {
    products(
      first: $first
      after: $after
      where: {
        status: "publish"
        category: $category
        categoryNotIn: $categoryNotIn
      }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ${CATALOG_LIST_FIELDS}
      }
    }
  }
`;

export const PRODUCT_SEARCH = `
  query ProductSearch($search: String!, $first: Int!, $after: String) {
    products(first: $first, after: $after, where: { search: $search, status: "publish" }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ${CATALOG_LIST_FIELDS}
      }
    }
  }
`;

/** @deprecated Use PRODUCT_CATALOG_PAGE with pagination */
export const MOTORCYCLES_CATALOG = PRODUCT_CATALOG_PAGE;

/** @deprecated Use PRODUCT_CATALOG_PAGE with pagination */
export const EQUIPMENT_CATALOG = PRODUCT_CATALOG_PAGE;
