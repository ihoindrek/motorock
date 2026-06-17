export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categories: readonly string[];
  publishedAt: string;
  readTime: string;
  image: string;
  imageAlt: string;
  author: string;
  contentHtml: string;
};
