"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** True on viewports narrower than Tailwind's `lg` breakpoint (1024px) — matches when the app switches from sidebar to bottom nav. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 1023px)");
}
