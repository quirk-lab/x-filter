import { useEffect, useState } from 'react';

/** Default mobile breakpoint in px (matches Tailwind's `sm`). */
export const DEFAULT_MOBILE_BREAKPOINT = 640;

/**
 * Returns `true` when the viewport is narrower than `breakpoint` px.
 *
 * SSR- and jsdom-safe: when `window.matchMedia` is unavailable it returns
 * `false` (the desktop layout), so server renders and unit tests default to the
 * horizontal layout and only switch to the mobile layout on the client once a
 * real `matchMedia` confirms a narrow viewport.
 */
export function useIsMobile(breakpoint: number = DEFAULT_MOBILE_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    // Subtract a hair so the breakpoint itself counts as desktop, matching the
    // `min-width`-based CSS breakpoints used by the shadcn (Tailwind) adapter.
    const mql = window.matchMedia(`(max-width: ${breakpoint - 0.02}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [breakpoint]);

  return isMobile;
}
