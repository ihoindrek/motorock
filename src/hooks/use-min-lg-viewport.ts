"use client";

import { useEffect, useState } from "react";

const MIN_LG_QUERY = "(min-width: 1024px)";

/** Matches Tailwind `lg:` — desktop checkout shows all steps on one page. */
export function useMinLgViewport() {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(MIN_LG_QUERY);
    const sync = () => setMatches(media.matches);

    sync();
    media.addEventListener("change", sync);

    return () => media.removeEventListener("change", sync);
  }, []);

  return matches;
}
