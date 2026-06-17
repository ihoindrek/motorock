const BLOG_POST_CARD_FIELDS = `
  databaseId
  title
  slug
  date
  excerpt
  featuredImage {
    node {
      sourceUrl
      altText
    }
  }
  author {
    node {
      name
    }
  }
  categories {
    nodes {
      name
      slug
    }
  }
`;

export const BLOG_POSTS_LIST = `
  query BlogPostsList($first: Int!, $after: String) {
    contentNodes(first: $first, after: $after, where: { contentTypes: POST }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on Post {
          ${BLOG_POST_CARD_FIELDS}
        }
      }
    }
  }
`;

export const BLOG_POST_BY_SLUG = `
  query BlogPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      ${BLOG_POST_CARD_FIELDS}
      content
    }
  }
`;
