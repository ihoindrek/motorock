"use client";

import { useEffect, useRef } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { BlogCard, BlogCardGrid } from "@/components/blog/blog-card";
import { CarouselArrow } from "@/components/ui/carousel-arrow";
import { useDictionary } from "@/context/locale-context";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { BlogPost } from "@/types/blog-post";

import "swiper/css";

type HomeBlogPostsViewProps = {
  posts: readonly BlogPost[];
  locale: "en" | "et";
  copy: Dictionary["blog"];
};

export function HomeBlogPostsView({ posts, locale, copy }: HomeBlogPostsViewProps) {
  const dict = useDictionary();
  const swiperRef = useRef<SwiperInstance | null>(null);

  useEffect(() => {
    swiperRef.current?.update();
  }, [posts]);

  return (
    <>
      <div className="md:hidden">
        <div className="w-full overflow-visible">
          <Swiper
            modules={[A11y]}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            observer
            observeParents
            resizeObserver
            spaceBetween={16}
            slidesPerView={1.15}
            grabCursor
            speed={600}
            className="w-full !overflow-visible"
          >
            {posts.map((post, index) => (
              <SwiperSlide key={post.slug} className="!h-auto">
                <BlogCard
                  post={post}
                  locale={locale}
                  copy={copy}
                  variant="home"
                  priority={index === 0}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          {posts.length > 1 ? (
            <nav
              aria-label={dict.carousel.navigation}
              className="mt-6 flex items-center justify-between"
            >
              <CarouselArrow
                direction="prev"
                label={dict.carousel.previousProduct}
                text={dict.carousel.previous}
                onClick={() => swiperRef.current?.slidePrev()}
                theme="light"
              />
              <CarouselArrow
                direction="next"
                label={dict.carousel.nextProduct}
                text={dict.carousel.next}
                onClick={() => swiperRef.current?.slideNext()}
                theme="light"
              />
            </nav>
          ) : null}
        </div>
      </div>

      <div className="hidden md:block">
        <BlogCardGrid
          posts={posts}
          locale={locale}
          copy={copy}
          variant="home"
          className="gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7"
        />
      </div>
    </>
  );
}
