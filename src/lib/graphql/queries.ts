/** Global attributes expose taxonomy term names (e.g. S) alongside WPML option slugs (s-et). */
const PRODUCT_ATTRIBUTE_FIELDS = `
  name
  options
  variation
  ... on GlobalProductAttribute {
    terms(first: 100) {
      nodes {
        name
        slug
      }
    }
  }
`;

/** List/card view — no variations; sizes/colors come from product attributes. */
const CATALOG_LIST_FIELDS = `
  ... on Product {
    databaseId
    name
    slug
    sku
    date
    modified
    languageCode
    translations {
      databaseId
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
        ${PRODUCT_ATTRIBUTE_FIELDS}
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
        ${PRODUCT_ATTRIBUTE_FIELDS}
      }
    }
  }
`;

const PRODUCT_DETAIL_FIELDS = `
  databaseId
  name
  slug
  sku
  date
  languageCode
  translations {
    databaseId
    slug
    name
    language {
      code
    }
  }
  shortDescription
  description
  image {
    databaseId
    sourceUrl
    altText
  }
  galleryImages {
    nodes {
      databaseId
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
        ${PRODUCT_ATTRIBUTE_FIELDS}
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
        ${PRODUCT_ATTRIBUTE_FIELDS}
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
`;

export const PRODUCT_BY_SLUG = `
  query ProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      ${PRODUCT_DETAIL_FIELDS}
    }
  }
`;

export const PRODUCT_BY_DATABASE_ID = `
  query ProductByDatabaseId($id: ID!) {
    product(id: $id, idType: DATABASE_ID) {
      ${PRODUCT_DETAIL_FIELDS}
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

export const PRODUCT_BRAND_CATALOG_PAGE = `
  query ProductBrandCatalogPage(
    $first: Int!
    $after: String
    $category: String
    $categoryNotIn: [String]
    $brandTaxonomyTerms: [String]!
  ) {
    products(
      first: $first
      after: $after
      where: {
        status: "publish"
        category: $category
        categoryNotIn: $categoryNotIn
        taxonomyFilter: {
          filters: [
            {
              taxonomy: PA_BRAND
              operator: IN
              terms: $brandTaxonomyTerms
            }
          ]
        }
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

export const HOMEPAGE_PRODUCT_CATALOG_PAGE = `
  query HomepageProductCatalogPage($first: Int!, $after: String, $category: String, $categoryNotIn: [String]) {
    products(
      first: $first
      after: $after
      where: {
        status: "publish"
        category: $category
        categoryNotIn: $categoryNotIn
        orderby: { field: DATE, order: DESC }
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
