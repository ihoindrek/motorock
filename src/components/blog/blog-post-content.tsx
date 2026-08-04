"use client";

type BlogPostContentProps = {
  html: string;
};

export function BlogPostContent({ html }: BlogPostContentProps) {
  return (
    <div
      className="blog-content product-description prose max-w-none text-base leading-[1.8] text-ink/75 sm:text-lg [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-accent [&_figcaption]:mt-2 [&_figcaption]:text-sm [&_figcaption]:text-ink/50 [&_figure]:my-8 [&_h2]:mt-12 [&_h2]:font-body [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:normal-case [&_h2]:tracking-normal [&_h2]:text-ink [&_h3]:mt-8 [&_h3]:font-body [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:normal-case [&_h3]:tracking-normal [&_h3]:text-ink [&_img]:my-0 [&_img]:h-auto [&_img]:w-full [&_p]:mb-5 [&_strong]:font-semibold [&_strong]:text-ink"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
