"use client";

import { useDictionary } from "@/context/locale-context";
import { useWishlist, type WishlistItem } from "@/context/wishlist-context";
import { cn } from "@/lib/utils";

type WishlistButtonProps = {
  item: WishlistItem;
  className?: string;
  /** Overlay on product card images */
  variant?: "icon" | "text";
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      className="size-5"
      aria-hidden="true"
    >
      <path d="M12 21s-6.5-4.35-9.33-8.04C.74 10.4 1.1 6.9 3.7 5.2c1.9-1.25 4.35-.9 5.8.7L12 8.35l2.5-2.45c1.45-1.6 3.9-1.95 5.8-.7 2.6 1.7 2.96 5.2 1.03 7.76C18.5 16.65 12 21 12 21z" />
    </svg>
  );
}

export function WishlistButton({
  item,
  className,
  variant = "icon",
}: WishlistButtonProps) {
  const dict = useDictionary();
  const { has, toggle, hydrated } = useWishlist();
  const saved = hydrated && has(item.slug);

  const label = saved ? dict.wishlist.remove : dict.wishlist.add;

  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={() => toggle(item)}
        aria-pressed={saved}
        aria-label={label}
        className={cn(
          "inline-flex items-center gap-2 font-body text-[10px] font-bold uppercase tracking-aggressive transition-colors",
          saved ? "text-accent" : "text-ink/45 hover:text-accent",
          className,
        )}
      >
        <HeartIcon filled={saved} />
        {saved ? dict.wishlist.saved : dict.wishlist.add}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(item);
      }}
      aria-pressed={saved}
      aria-label={label}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border border-ink/10 bg-paper/90 text-ink shadow-sm backdrop-blur-sm transition-colors hover:border-accent hover:text-accent",
        saved && "border-accent/40 text-accent",
        className,
      )}
    >
      <HeartIcon filled={saved} />
    </button>
  );
}
