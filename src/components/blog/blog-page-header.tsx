import type { ReactNode } from "react";
import {
  BlogEditorialColumn,
  blogEditorialShellClassName,
} from "@/components/blog/blog-editorial-column";

type BlogPageHeaderProps = {
  children?: ReactNode;
};

export function BlogPageHeader({ children }: BlogPageHeaderProps) {
  return (
    <section className="border-b border-ink/10 bg-moto">
      <div
        className={`${blogEditorialShellClassName} pt-16 pb-8 lg:pt-24 lg:pb-10`}
      >
        <BlogEditorialColumn className="flex flex-col gap-6">
          <div className="flex flex-col gap-5">
            <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Stories from
              <br />
              <span className="bg-gradient-to-r from-[#FF5A00] via-[#ff7e26] to-[#ff9c59] bg-clip-text text-transparent">
                the road.
              </span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-ink/65 sm:text-lg">
              Garage notes, gear guides, and motorcycle culture — straight from
              the Motorock crew.
            </p>
          </div>
          {children}
        </BlogEditorialColumn>
      </div>
    </section>
  );
}
