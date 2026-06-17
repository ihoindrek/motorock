"use client";

type BlogPostContentProps = {
  html: string;
};

export function BlogPostContent({ html }: BlogPostContentProps) {
  return (
    <div
      className="blog-content product-description prose max-w-none text-base leading-[1.8] text-ink/75 sm:text-lg [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-accent [&_figcaption]:mt-2 [&_figcaption]:text-sm [&_figcaption]:text-ink/50 [&_figure]:my-8 [&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:text-ink [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-aggressive [&_h3]:text-ink [&_img]:my-0 [&_img]:h-auto [&_img]:w-full [&_p]:mb-5 [&_strong]:font-semibold [&_strong]:text-ink"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
