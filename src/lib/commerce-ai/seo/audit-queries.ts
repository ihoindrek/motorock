const SEO_AUDIT_PRODUCT_FIELDS = `
  ... on Product {
    databaseId
    name
    slug
    sku
    languageCode
    shortDescription
    description
    translations {
      databaseId
      slug
      language { code }
    }
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
        slug
        parent { node { slug } }
      }
    }
    metaData {
      key
      value
    }
  }
`;

export const SEO_AUDIT_PRODUCTS_PAGE = `
  query SeoAuditProductsPage($first: Int!, $after: String) {
    products(first: $first, after: $after, where: { status: "publish" }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ${SEO_AUDIT_PRODUCT_FIELDS}
      }
    }
  }
`;

export const SEO_AUDIT_POSTS_PAGE = `
  query SeoAuditPostsPage($first: Int!, $after: String) {
    contentNodes(first: $first, after: $after, where: { contentTypes: POST }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on Post {
          databaseId
          title
          slug
          languageCode
          excerpt
          translations {
            databaseId
            slug
            title
            language { code }
          }
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  }
`;
