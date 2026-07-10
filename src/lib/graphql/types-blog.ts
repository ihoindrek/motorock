export type GraphQLBlogCategory = {
  name: string;
  slug: string;
  languageCode?: string | null;
  translations?: Array<{
    name?: string | null;
    slug?: string | null;
    language?: {
      code?: string | null;
    } | null;
  }> | null;
};

export type GraphQLBlogPostCard = {
  databaseId: number;
  title: string;
  slug: string;
  languageCode?: string | null;
  translations?: Array<{
    slug?: string | null;
    title?: string | null;
    language?: {
      code?: string | null;
    } | null;
  }> | null;
  date: string;
  excerpt: string | null;
  featuredImage: {
    node: {
      sourceUrl: string | null;
      altText: string | null;
    } | null;
  } | null;
  author: {
    node: {
      name: string | null;
    } | null;
  } | null;
  categories: {
    nodes: GraphQLBlogCategory[];
  } | null;
};

export type GraphQLBlogPost = GraphQLBlogPostCard & {
  content: string | null;
};

export type BlogPostsPageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};

export type BlogPostsListResponse = {
  contentNodes: {
    pageInfo: BlogPostsPageInfo;
    nodes: Array<GraphQLBlogPostCard | null>;
  };
};

export type BlogPostBySlugResponse = {
  post: GraphQLBlogPost | null;
};
