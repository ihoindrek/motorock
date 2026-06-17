import Image from "next/image";
import Link from "next/link";
import { formatBlogDate } from "@/lib/blog/posts";
import type { BlogPost } from "@/types/blog-post";
import { BlogBadge } from "@/components/blog/blog-badge";
import { cn } from "@/lib/utils";

type BlogCardProps = {
  post: BlogPost;
  priority?: boolean;
  variant?: "feature" | "card" | "compact";
};

export function BlogCard({
  post,
  priority = false,
  variant = "card",
}: BlogCardProps) {
  if (variant === "feature") {
    return <BlogFeatureCard post={post} priority={priority} />;
  }

  if (variant === "compact") {
    return <BlogCompactCard post={post} />;
  }

  return (
    <article className="group">
      <Link
        href={`/blog/${post.slug}`}
        className="block outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <figure className="relative aspect-[4/5] overflow-hidden bg-ink">
          <Image
            src={post.image}
            alt={post.imageAlt}
            fill
            priority={priority}
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent opacity-90"
            aria-hidden="true"
          />
          <figcaption className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <BlogBadge variant="accent">{post.category}</BlogBadge>
              <BlogBadge variant="on-dark">
                <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
              </BlogBadge>
            </div>
            <h2 className="mt-3 font-display text-xl font-extrabold uppercase leading-[1.05] tracking-tight text-paper transition-colors duration-200 group-hover:text-accent sm:text-2xl">
              {post.title}
            </h2>
          </figcaption>
        </figure>
        <p className="mt-4 line-clamp-2 text-base leading-relaxed text-ink/60 sm:text-lg">
          {post.excerpt}
        </p>
        <span className="mt-3 inline-flex">
          <BlogBadge className="transition-colors group-hover:bg-accent group-hover:text-paper group-hover:border-transparent">
            Read →
          </BlogBadge>
        </span>
      </Link>
    </article>
  );
}

function BlogFeatureCard({
  post,
  priority,
}: {
  post: BlogPost;
  priority?: boolean;
}) {
  return (
    <article className="group">
      <Link
        href={`/blog/${post.slug}`}
        className="grid overflow-hidden border border-ink/10 bg-moto transition-colors duration-200 group-hover:border-ink/20 lg:grid-cols-12 lg:min-h-[28rem]"
      >
        <figure className="relative aspect-[16/10] overflow-hidden bg-detail lg:col-span-7 lg:aspect-auto lg:min-h-[28rem]">
          <Image
            src={post.image}
            alt={post.imageAlt}
            fill
            priority={priority}
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            sizes="(max-width: 1024px) 100vw, 58vw"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-20 bg-gradient-to-b from-transparent to-moto lg:hidden"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-[1] hidden w-[38%] bg-gradient-to-r from-transparent to-moto lg:block"
            aria-hidden="true"
          />
        </figure>

        <div className="flex flex-col justify-end gap-5 bg-moto p-6 sm:p-8 lg:col-span-5 lg:p-10 xl:p-12">
          <div className="flex flex-wrap items-center gap-2">
            <BlogBadge variant="accent">Featured</BlogBadge>
            <BlogBadge>{post.category}</BlogBadge>
            <BlogBadge>
              <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
            </BlogBadge>
          </div>
          <h2 className="font-display text-[clamp(1.5rem,3.25vw,2.25rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-ink transition-colors duration-200 group-hover:text-accent">
            {post.title}
          </h2>
          <p className="max-w-md text-base leading-relaxed text-ink/65 sm:text-lg">
            {post.excerpt}
          </p>
          <span className="inline-flex">
            <BlogBadge className="transition-colors group-hover:bg-accent group-hover:text-paper group-hover:border-transparent">
              Read article →
            </BlogBadge>
          </span>
        </div>
      </Link>
    </article>
  );
}

function BlogCompactCard({ post }: { post: BlogPost }) {
  return (
    <article className="group">
      <Link
        href={`/blog/${post.slug}`}
        className="flex gap-3 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:gap-3.5"
      >
        <figure className="relative aspect-square w-[4.5rem] shrink-0 overflow-hidden bg-ink sm:w-20">
          <Image
            src={post.image}
            alt={post.imageAlt}
            fill
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            sizes="80px"
          />
        </figure>
        <div className="min-w-0 py-0.5">
          <BlogBadge variant="accent" className="px-2.5 py-0.5 text-[9px]">
            {post.category}
          </BlogBadge>
          <h3 className="mt-2 font-display text-xs font-extrabold uppercase leading-snug tracking-tight text-ink transition-colors group-hover:text-accent">
            {post.title}
          </h3>
        </div>
      </Link>
    </article>
  );
}

export function BlogCardGrid({
  posts,
  className,
}: {
  posts: readonly BlogPost[];
  className?: string;
}) {
  return (
    <ul className={cn("grid grid-cols-1 gap-10 sm:grid-cols-2 lg:gap-12", className)}>
      {posts.map((post, index) => (
        <li key={post.slug}>
          <BlogCard post={post} priority={index < 2} />
        </li>
      ))}
    </ul>
  );
}
