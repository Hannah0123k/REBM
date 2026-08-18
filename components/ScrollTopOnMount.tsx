"use client";

import { useEffect, useLayoutEffect } from "react";

// Run before paint on the client (so entry lands at the top without a flash);
// falls back to useEffect on the server to avoid the SSR warning.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Forces a scroll to the top of the page on mount, so entering a page after
 * scrolling elsewhere lands at the very top rather than part-way down.
 *
 * Scrolling is instant site-wide (no `scroll-behavior: smooth` in globals.css),
 * so the `auto` forced below is now just a guard against an inline override; the
 * scroll-to-top itself is the point. Drop this on any page that needs it.
 */
export function ScrollTopOnMount() {
  useIsomorphicLayoutEffect(() => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    // Hold `auto` across the whole navigation-settle window: the App Router
    // scrolls the new page to the top AFTER this effect runs, so the window has
    // to outlast that. Restoring on the next frame was too early and let the
    // scroll-to-top animate up from the previous page's position back when the
    // stylesheet still set smooth.
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
