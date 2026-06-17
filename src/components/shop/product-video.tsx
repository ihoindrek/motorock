type ProductVideoProps = {
  vimeoId: string;
  title: string;
  theme?: "light" | "dark";
};

export function ProductVideo({
  vimeoId,
  title,
  theme = "light",
}: ProductVideoProps) {
  const isDark = theme === "dark";

  return (
    <section aria-labelledby="product-video-heading">
      <h2
        id="product-video-heading"
        className={`font-body text-xs font-bold uppercase tracking-aggressive ${
          isDark ? "text-paper/40" : "text-ink/50"
        }`}
      >
        Watch
      </h2>
      <div className="relative mt-6 aspect-video w-full overflow-hidden bg-ink">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </section>
  );
}
