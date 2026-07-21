"use client";

import { useEffect, useLayoutEffect } from "react";

// Run before paint on the client (so entry lands at the top without a flash);
// falls back to useEffect on the server to avoid the SSR warning.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Forces an INSTANT scroll to the top of the page on mount, then restores the
 * page's normal scroll behaviour. The site sets `html { scroll-behavior: smooth }`
 * (for in-page anchor links), which also animates the App Router's scroll-to-top
 * on navigation — so arriving on a page after scrolling elsewhere looks like it
 * "scrolls up from the bottom". Dropping this on a page makes entry land at the
 * very top immediately, without changing smooth anchor scrolling anywhere else.
 */
export function ScrollTopOnMount() {
  useIsomorphicLayoutEffect(() => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    // Force instant scrolling for the whole navigation-settle window. The App
    // Router scrolls the new page to the top AFTER this effect runs, and it
    // respects the global `scroll-behavior: smooth` — so restoring smooth on the
    // next frame (too early) let that scroll-to-top animate up from the previous
    // page's position. Keeping `auto` for a beat makes every scroll during entry
    // instant, then smooth is restored for later in-page anchor clicks.
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    const raf = requestAnimationFrame(() => window.scrollTo(0, 0));
    const restore = setTimeout(() => {
      html.style.scrollBehavior = prev;
    }, 300);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(restore);
    };
  }, []);

  return null;
}
